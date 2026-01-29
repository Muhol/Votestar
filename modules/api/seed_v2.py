import asyncio
import os
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.models.generic import (
    User, UserType, Category, CategoryType, CategoryStatus, 
    Candidate, Vote, UserFollow, CategoryProposalSignature
)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Fix for asyncpg: remove sslmode=require from query params
if "sslmode=require" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")

async def seed():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("--- CLEARING DATABASE ---")
        # Order matters for foreign keys
        tables = [
            "user_follows", "category_proposal_signatures", "votes", 
            "audit_logs", "candidates", "categories", "users"
        ]
        for table in tables:
            await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        await session.commit()
        print("Database cleared.")

        print("--- SEEDING USERS ---")
        users = [
            User(
                email="admin@votestar.io",
                phone_number="+10000000000",
                user_type=UserType.INDIVIDUAL,
                is_verified=True,
                subscription_tier="Enterprise",
                device_fingerprint="system_admin"
            ),
            User(
                email="contact@globalmedia.com",
                phone_number="+10000000001",
                user_type=UserType.ORGANIZATION,
                is_verified_org=True,
                follower_count=15000,
                device_fingerprint="org_media"
            ),
            User(
                email="google-oauth2|105272031823887978009", # Current User
                phone_number="+10000000002",
                user_type=UserType.INDIVIDUAL,
                is_verified=True,
                device_fingerprint="auth0_verified"
            ),
            User(
                email="citizen_jane@gmail.com",
                phone_number="+10000000003",
                user_type=UserType.INDIVIDUAL,
                is_verified=False,
                device_fingerprint="user_jane"
            )
        ]
        session.add_all(users)
        await session.commit()
        for u in users: await session.refresh(u)
        
        admin, media_org, current_user, jane = users
        print(f"Users created: {len(users)}")

        print("--- SEEDING CATEGORIES ---")
        categories = [
            Category(
                name="Best Modern Architecture",
                description="Iconic structures built in the 21st century that define our skyline.",
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=30),
                status="ACTIVE",
                category_type="OFFICIAL",
                creator_id=admin.id
            ),
            Category(
                name="The Greatest Sci-Fi Masterpiece",
                description="From distant galaxies to cyberpunk futures. Vote for the definitive film.",
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=30),
                status="ACTIVE",
                category_type="OFFICIAL",
                creator_id=media_org.id
            ),
            Category(
                name="Favorite Retro Console",
                description="8-bit vs 16-bit. Which era defined your childhood?",
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=7),
                status="PROPOSAL",
                category_type="COMMUNITY",
                creator_id=jane.id,
                proposal_signatures=12
            )
        ]
        session.add_all(categories)
        await session.commit()
        for c in categories: await session.refresh(c)
        
        arch, scifi, retro = categories
        print(f"Categories created: {len(categories)}")

        print("--- SEEDING CANDIDATES ---")
        candidates = [
            # Architecture
            Candidate(name="Burj Khalifa", category_id=arch.id, cloudinary_image_url=""),
            Candidate(name="Sydney Opera House", category_id=arch.id, cloudinary_image_url=""),
            Candidate(name="The Shard", category_id=arch.id, cloudinary_image_url=""),
            # Sci-Fi
            Candidate(name="Interstellar", category_id=scifi.id, cloudinary_image_url=""),
            Candidate(name="Blade Runner 2049", category_id=scifi.id, cloudinary_image_url=""),
            Candidate(name="The Matrix", category_id=scifi.id, cloudinary_image_url=""),
        ]
        session.add_all(candidates)
        await session.commit()
        print(f"Candidates created: {len(candidates)}")

        print("--- SEEDING SOCIAL GRAPH ---")
        follows = [
            UserFollow(follower_id=current_user.id, followed_id=media_org.id),
            UserFollow(follower_id=jane.id, followed_id=media_org.id),
            UserFollow(follower_id=jane.id, followed_id=current_user.id)
        ]
        session.add_all(follows)
        
        # Add some initial signatures for the proposal
        sigs = [
            CategoryProposalSignature(user_id=current_user.id, category_id=retro.id)
        ]
        session.add_all(sigs)
        
        await session.commit()
        print("Social links and signatures added.")

    print("--- SEEDING COMPLETE ---")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
