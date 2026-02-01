from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv() # Load variables from .env

from app.routers import votes, categories, proposals, users, relationships, blocks, comments, conversations
from app.core.database import init_db

app = FastAPI(
    title="Votestar API",
    description="Financial-grade voting platform API",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    # Initialize the Neon DB tables
    await init_db()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to Votestar domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(votes.router, prefix="/api/v1", tags=["votes"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])
app.include_router(proposals.router, prefix="/api/v1", tags=["proposals"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(relationships.router, prefix="/api/v1", tags=["relationships"])
app.include_router(blocks.router, prefix="/api/v1", tags=["blocks"])
app.include_router(comments.router, prefix="/api/v1", tags=["comments"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
