import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select, func
from app.models.generic import (
    User, UserType, Category, CategoryType, CategoryStatus, 
    Candidate, Vote, UserFollow, CategoryProposalSignature
)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if "sslmode=require" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")

async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("--- CLEARING DATABASE ---")
        tables = ["user_follows", "category_proposal_signatures", "votes", "audit_logs", "candidates", "categories", "users"]
        for table in tables:
            await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        await session.commit()

        print("--- GENERATING 35 CITIZENS & ORGS ---")
        users = []
        # Special Users
        me_auth0 = User(
            email="google-oauth2|105272031823887978009",
            phone_number="+10000000000",
            user_type=UserType.INDIVIDUAL,
            is_verified=True,
            device_fingerprint="auth0_verified"
        )
        users.append(me_auth0)

        # 6 Organizations
        org_names = ["Global News Network", "Tech Innovators Inc", "Green Earth Alliance", "Future Finance", "SpaceX Citizens", "Modern Arts Collective"]
        for name in org_names:
            users.append(User(
                email=f"contact@{name.lower().replace(' ', '')}.com",
                phone_number=f"+1{random.randint(1000000000, 9999999999)}",
                user_type=UserType.ORGANIZATION,
                is_verified_org=True,
                device_fingerprint=f"org_{name.lower()[:3]}"
            ))

        # 28 Regular Individuals
        for i in range(28):
            users.append(User(
                email=f"citizen_{i}@gmail.com",
                phone_number=f"+1{random.randint(1000000000, 9999999999)}",
                user_type=UserType.INDIVIDUAL,
                is_verified=random.choice([True, False]),
                device_fingerprint=f"fingerprint_{i}"
            ))

        session.add_all(users)
        await session.commit()
        for u in users: await session.refresh(u)

        print("--- GENERATING 35 CATEGORIES (15 ACTIVE, 20 PROPOSALS) ---")
        all_categories = []
        
        # 15 Active Categories
        active_names = [
            "Best Cloud Provider 2026", "Greatest Sci-Fi Masterpiece", "Most Iconic Car Design", 
            "Leader of Tech Innovation", "Best Programming Language", "Top Sustainable City",
            "Greatest Athlete of All Time", "Most Influential Artist", "Best Modern Architecture",
            "Top Crypto Project", "Best Coffee Chain", "Greatest Video Game",
            "Most Reliable Car Brand", "Top Travel Destination", "Best Smartphone 2025"
        ]
        
        for name in active_names:
            creator = random.choice(users)
            all_categories.append(Category(
                name=name,
                description=f"Determining the sovereign consensus for {name}. Every vote is recorded on the ledger.",
                start_time=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                end_time=datetime.utcnow() + timedelta(days=20),
                status="ACTIVE",
                category_type="OFFICIAL" if creator.user_type == UserType.ORGANIZATION else "COMMUNITY",
                creator_id=creator.id
            ))

        # 20 Proposals
        proposal_names = [
            "The Best Pizza Style", "Most Comfortable Sneakers", "Best Desktop OS", 
            "Favorite Marvel Movie", "Best Summer Activity", "Top Remote Work Location",
            "Best Electric Vehicle", "Greatest Rock Band", "Most Useful AI Tool",
            "Best Podcast 2026", "Top Coding Bootcamp", "Most Anticipated Game 2027",
            "Best Mechanical Keyboard", "Top Streaming Platform", "Best Web Framework",
            "Greatest Fantasy Novel", "Best Craft Beer", "Top Space Mission",
            "Most Impactful Tech Trend", "Best Fitness Routine"
        ]

        for name in proposal_names:
            creator = random.choice(users)
            all_categories.append(Category(
                name=name,
                description=f"A community proposal to decide the consensus on {name}.",
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(days=7),
                status="PROPOSAL",
                category_type="COMMUNITY",
                creator_id=creator.id
            ))

        session.add_all(all_categories)
        await session.commit()
        for c in all_categories: await session.refresh(c)

        print("--- GENERATING CANDIDATES ---")
        candidates = []
        for cat in all_categories:
            if cat.status == "ACTIVE":
                for i in range(4):
                    candidates.append(Candidate(
                        name=f"{cat.name} Candidate {i+1}",
                        category_id=cat.id,
                        cloudinary_image_url=""
                    ))
        session.add_all(candidates)
        await session.commit()
        for cand in candidates: await session.refresh(cand)

        print("--- GENERATING SOCIAL GRAPH (FOLLOW RELATIONSHIPS) ---")
        follows = []
        for u in users:
            # Each user follows 5-10 random people
            targets = random.sample(users, random.randint(5, 12))
            for target in targets:
                if u.id != target.id:
                    follows.append(UserFollow(follower_id=u.id, followed_id=target.id))
        
        # Remove duplicates from programmatic generation
        unique_follows = {(f.follower_id, f.followed_id): f for f in follows}
        session.add_all(unique_follows.values())
        await session.commit()

        print("--- GENERATING VOTES & SIGNATURES ---")
        # 1. Votes for active categories
        votes = []
        active_cats = [c for c in all_categories if c.status == "ACTIVE"]
        for u in users:
            if u.user_type == UserType.INDIVIDUAL:
                # Individual votes for 3-7 categories
                voted_cats = random.sample(active_cats, random.randint(3, 8))
                for cat in voted_cats:
                    cat_candidates = [c for c in candidates if c.category_id == cat.id]
                    if cat_candidates:
                        cand = random.choice(cat_candidates)
                        votes.append(Vote(
                            user_id=u.id,
                            category_id=cat.id,
                            candidate_id=cand.id,
                            device_signature=f"sig_{uuid.uuid4().hex[:10]}",
                            idempotency_key=str(uuid.uuid4()),
                            vote_hash=uuid.uuid4().hex
                        ))
        
        # 2. Signatures for proposals
        signatures = []
        proposal_cats = [c for c in all_categories if c.status == "PROPOSAL"]
        for u in users:
            # Everyone signs 5-10 proposals
            signed_props = random.sample(proposal_cats, random.randint(5, 12))
            for prop in signed_props:
                signatures.append(CategoryProposalSignature(
                    user_id=u.id,
                    category_id=prop.id
                ))
        
        session.add_all(votes)
        session.add_all(signatures)
        await session.commit()

        print("--- SYNCHRONIZING METRICS (FOLLOWER COUNTS, SIGNATURE COUNTS) ---")
        # Update follower counts
        for u in users:
            count = len([f for f in unique_follows.values() if f.followed_id == u.id])
            u.follower_count = count
            session.add(u)
        
        # Update proposal signatures
        for cat in all_categories:
            if cat.status == "PROPOSAL":
                count = len([s for s in signatures if s.category_id == cat.id])
                cat.proposal_signatures = count
                session.add(cat)
        
        await session.commit()
        print(f"Metrics synced: {len(users)} users, {len(all_categories)} categories.")

    print("--- HIGH INTENSITY SEED COMPLETE ---")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
