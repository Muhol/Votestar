from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os

# Using a default URL for development, but in production this should be env var
# Note: asyncpg is required for async support
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Clean up standard postgres prefix
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Strip query params like ?sslmode=require which asyncpg handles via connect_args
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

# Default to a safe placeholder if no URL is provided
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://user:password@localhost/votestar"

# SSL configuration for Neon / Managed DBs
# asyncpg uses 'ssl' not 'sslmode'
connect_args = {}
if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    DATABASE_URL, 
    echo=True, 
    future=True,
    connect_args=connect_args
)

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        # verifying connection
        await conn.run_sync(SQLModel.metadata.create_all)
