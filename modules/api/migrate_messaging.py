import asyncio
from sqlalchemy import text
from app.core.database import engine
from app.models.generic import SQLModel

async def migrate():
    async with engine.begin() as conn:
        # Add reply_to_id column
        try:
            await conn.execute(text("ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);"))
            print("Added reply_to_id column.")
        except Exception as e:
            print(f"Column might already exist or error: {e}")

        # Create new tables (MessageLike) if they don't exist
        await conn.run_sync(SQLModel.metadata.create_all)
        print("Ensured all tables exist.")

if __name__ == "__main__":
    asyncio.run(migrate())
