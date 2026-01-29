import asyncio
import uuid
import hashlib
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select
from app.models.generic import Category, Candidate, User, Vote
import os
from dotenv import load_dotenv

load_dotenv()

# We use the sync engine for simple seeding
DB_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://") if os.getenv("DATABASE_URL") else None
if not DB_URL:
    DB_URL = "postgresql://neondb_owner:npg_QKFR9B8YatLj@ep-dry-band-ahkhtg24-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DB_URL)

async def seed_data():
    print("🌱 Seeding Votestar Ledger...")
    
    with Session(engine) as session:
        # 1. Create a Primary User
        user_id = uuid.UUID('11111111-1111-1111-1111-111111111111')
        test_user = session.get(User, user_id)
        if not test_user:
            test_user = User(
                id=user_id,
                email="genesis@votestar.com",
                phone_number="+1000000000",
                is_verified=True,
                device_fingerprint="genesis_node_01"
            )
            session.add(test_user)
            print(f"  + Added Genesis User: {test_user.email}")
        
        session.commit()

        # 2. Create Categories
        music_id = uuid.UUID('34200000-8cf0-11bd-b23e-10b96e4ef00d')
        football_id = uuid.UUID('34200000-8cf0-11bd-b23e-10b96e4ef00e')

        music_cat = Category(
            id=music_id,
            name="Star of Music 2026",
            description="The global definitive vote for the apex of sonic influence. Decide the voice of the new decade.",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(days=365)
        )
        
        football_cat = Category(
            id=football_id,
            name="GOAT of Football",
            description="Pitch legends and rising icons. The ultimate debate settled by the immutable collective voice.",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(days=365)
        )

        for cat in [music_cat, football_cat]:
            existing = session.get(Category, cat.id)
            if not existing:
                session.add(cat)
                print(f"  + Added Category: {cat.name}")

        session.commit()

        # 3. Add Candidates
        candidates = [
            # Music
            Candidate(name="Taylor Swift", bio="Cultural zeitgeist and narrative master.", cloudinary_image_url="ts_01", category_id=music_id),
            Candidate(name="The Weeknd", bio="The dark prince of modern pop.", cloudinary_image_url="tw_01", category_id=music_id),
            Candidate(name="Burnaboy", bio="The African Giant leading the global sound.", cloudinary_image_url="bb_01", category_id=music_id),
            # Football
            Candidate(name="Lionel Messi", bio="The magician from Rosario.", cloudinary_image_url="lm_10", category_id=football_id),
            Candidate(name="Cristiano Ronaldo", bio="The relentless pursuit of perfection.", cloudinary_image_url="cr_7", category_id=football_id),
        ]

        # Tracking for vote seeding
        candidate_map = {}

        for cand in candidates:
            existing = session.exec(select(Candidate).where(Candidate.name == cand.name, Candidate.category_id == cand.category_id)).first()
            if not existing:
                session.add(cand)
                session.commit() # commit each to get IDs
                session.refresh(cand)
                candidate_map[cand.name] = cand.id
                print(f"  + Added Candidate: {cand.name}")
            else:
                candidate_map[cand.name] = existing.id

        # 4. Add Genesis Votes
        votes_to_add = [
            {"name": "Taylor Swift", "cat_id": music_id},
            {"name": "Lionel Messi", "cat_id": football_id},
        ]

        for vdata in votes_to_add:
            cand_id = candidate_map.get(vdata["name"])
            idem_key = f"genesis_vote_{vdata['name']}_{vdata['cat_id']}"
            
            existing_vote = session.exec(select(Vote).where(Vote.idempotency_key == idem_key)).first()
            if not existing_vote:
                # Generate a dummy hash
                raw_data = f"{user_id}|{vdata['cat_id']}|{cand_id}|genesis_signature"
                vhash = hashlib.sha256(raw_data.encode()).hexdigest()
                
                vote = Vote(
                    user_id=user_id,
                    category_id=vdata["cat_id"],
                    candidate_id=cand_id,
                    device_signature="genesis_signature",
                    idempotency_key=idem_key,
                    vote_hash=vhash
                )
                session.add(vote)
                print(f"  + Added Genesis Vote for: {vdata['name']}")

        session.commit()
        print("✅ Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
