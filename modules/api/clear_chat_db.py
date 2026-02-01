
import asyncio
import os
from sqlalchemy import text
from app.core.database import engine

async def clear_chats():
    print("Connecting to database...")
    async with engine.begin() as conn:
        print("Deleting message_likes...")
        await conn.execute(text("DELETE FROM message_likes"))
        
        print("Deleting messages...")
        await conn.execute(text("DELETE FROM messages"))
        
        print("Deleting conversation_participants...")
        await conn.execute(text("DELETE FROM conversation_participants"))
        
        print("Deleting conversations...")
        await conn.execute(text("DELETE FROM conversations"))
        
    print("Chat data cleared successfully.")

if __name__ == "__main__":
    # Try to load env if available
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
        
    asyncio.run(clear_chats())
