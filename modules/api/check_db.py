import asyncio
from app.core.database import engine
from sqlalchemy import inspect

async def check():
    def get_tables(sync_conn):
        return inspect(sync_conn).get_table_names()
    
    async with engine.connect() as conn:
        tables = await conn.run_sync(get_tables)
        print('Tables in DB:', tables)

if __name__ == "__main__":
    asyncio.run(check())
