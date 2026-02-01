import asyncio
from sqlmodel import text
from dotenv import load_dotenv
import os

load_dotenv()
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Starting comment interaction migration...")
        
        # 1. Add parent_id to comments if not exists
        try:
            await conn.execute(text("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id)"))
            print("Column 'parent_id' ensured in 'comments' table.")
        except Exception as e:
            print(f"Error adding parent_id: {e}")

        # 2. Create comment_likes table manually
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS comment_likes (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id),
                    comment_id UUID NOT NULL REFERENCES comments(id),
                    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                    CONSTRAINT one_like_per_user_per_comment UNIQUE (user_id, comment_id)
                )
            """))
            print("Table 'comment_likes' ensured.")
        except Exception as e:
            print(f"Error creating comment_likes: {e}")
            
        print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
