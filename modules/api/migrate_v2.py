import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

async def migrate():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not set.")
        return

    print(f"Connecting to: {DATABASE_URL[:30]}...")
    
    # SSL configuration for Neon / Managed DBs
    connect_args = {}
    if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
        connect_args["ssl"] = "require"

    engine = create_async_engine(DATABASE_URL, connect_args=connect_args)
    
    async def run_sql(sql_text, description):
        async with engine.begin() as conn:
            try:
                await conn.execute(text(sql_text))
                print(f"  + {description}: SUCCESS")
            except Exception as e:
                # Often fails if column exists, which is fine
                error_msg = str(e)
                if "already exists" in error_msg.lower():
                     print(f"  ? {description}: SKIPPED (Already exists)")
                else:
                     print(f"  ! {description}: FAILED - {error_msg[:100]}")

    print("Checking and applying schema updates (Isolated Transactions)...")
    
    # 0. Create Enum Types
    print("Creating Enum Types...")
    await run_sql("""
        DO $$ BEGIN
            CREATE TYPE usertype AS ENUM ('INDIVIDUAL', 'ORGANIZATION');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """, "Enum: UserType")
    
    await run_sql("""
        DO $$ BEGIN
            CREATE TYPE categorytype AS ENUM ('OFFICIAL', 'COMMUNITY', 'AI');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """, "Enum: CategoryType")
    
    await run_sql("""
        DO $$ BEGIN
            CREATE TYPE categorystatus AS ENUM ('PROPOSAL', 'ACTIVE', 'ARCHIVED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """, "Enum: CategoryStatus")
    
    # 1. Update Users Table
    columns_users = [
        ("user_type", "VARCHAR DEFAULT 'INDIVIDUAL'"),
        ("is_verified_org", "BOOLEAN DEFAULT FALSE"),
        ("follower_count", "INTEGER DEFAULT 0"),
        ("subscription_tier", "VARCHAR DEFAULT 'Free'"),
        ("is_identity_verified", "BOOLEAN DEFAULT FALSE"),
        ("national_id_hash", "VARCHAR UNIQUE")
    ]
    for col, spec in columns_users:
        await run_sql(f"ALTER TABLE users ADD COLUMN {col} {spec}", f"Column users.{col}")
    
    # Convert user_type column to enum if it exists as VARCHAR
    await run_sql("""
        ALTER TABLE users 
        ALTER COLUMN user_type TYPE usertype 
        USING user_type::usertype
    """, "Convert users.user_type to enum")

    # 2. Update Categories Table
    columns_cats = [
        ("creator_id", "UUID REFERENCES users(id)"),
        ("category_type", "VARCHAR DEFAULT 'OFFICIAL'"),
        ("status", "VARCHAR DEFAULT 'ACTIVE'"),
        ("proposal_signatures", "INTEGER DEFAULT 0"),
        ("updated_at", "TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()")
    ]
    for col, spec in columns_cats:
        await run_sql(f"ALTER TABLE categories ADD COLUMN {col} {spec}", f"Column categories.{col}")
    
    # Convert category columns to enums if they exist as VARCHAR
    await run_sql("""
        ALTER TABLE categories 
        ALTER COLUMN category_type TYPE categorytype 
        USING category_type::categorytype
    """, "Convert categories.category_type to enum")
    
    await run_sql("""
        ALTER TABLE categories 
        ALTER COLUMN status TYPE categorystatus 
        USING status::categorystatus
    """, "Convert categories.status to enum")

    # 3. Create New Table: category_proposal_signatures
    await run_sql("""
        CREATE TABLE IF NOT EXISTS category_proposal_signatures (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            category_id UUID REFERENCES categories(id),
            timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, category_id)
        )
    """, "Table: category_proposal_signatures")

    # 4. Create New Table: user_follows
    await run_sql("""
        CREATE TABLE IF NOT EXISTS user_follows (
            id UUID PRIMARY KEY,
            follower_id UUID REFERENCES users(id),
            followed_id UUID REFERENCES users(id),
            timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(follower_id, followed_id)
        )
    """, "Table: user_follows")

    print("\n--- VERIFICATION ---")
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'"))
        cols = [r[0] for r in res.fetchall()]
        print(f"Current columns in 'categories': {cols}")

    await engine.dispose()
    print("\nMigration protocol completed.")

if __name__ == "__main__":
    asyncio.run(migrate())
