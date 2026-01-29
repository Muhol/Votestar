import asyncio
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select
from app.models.generic import Category, Candidate, User
from app.core.database import DATABASE_URL, init_db
import os
from dotenv import load_dotenv

load_dotenv()

# We use the sync engine for simple seeding
SYNC_URL = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://") if os.getenv("DATABASE_URL") else "postgresql://user:password@localhost/votestar"

engine = create_engine(SYNC_URL)

async def seed_data():
    print("🌱 Seeding Votestar Ledger...")
    
    with Session(engine) as session:
        # 1. Create a Primary Category
        music_cat = Category(
            id=uuid.UUID('34200000-8cf0-11bd-b23e-10b96e4ef00d'), # Static UUID for easy testing
            name="Star of Music 2026",
            description="The global definitive vote for the apex of sonic influence. Decide the voice of the new decade.",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(days=365)
        )
        
        football_cat = Category(
            id=uuid.UUID('34200000-8cf0-11bd-b23e-10b96e4ef00e'),
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

        # 2. Add Candidates
        candidates = [
            # Music
            Candidate(name="Taylor Swift", bio="Cultural zeitgeist and narrative master.", cloudinary_image_url="ts_01", category_id=music_cat.id),
            Candidate(name="The Weeknd", bio="The dark prince of modern pop.", cloudinary_image_url="tw_01", category_id=music_cat.id),
            Candidate(name="Burnaboy", bio="The African Giant leading the global sound.", cloudinary_image_url="bb_01", category_id=music_cat.id),
            # Football
            Candidate(name="Lionel Messi", bio="The magician from Rosario.", cloudinary_image_url="lm_10", category_id=football_cat.id),
            Candidate(name="Cristiano Ronaldo", bio="The relentless pursuit of perfection.", cloudinary_image_url="cr_7", category_id=football_cat.id),
        ]

        for cand in candidates:
            # Check for candidate by name in this category
            existing = session.exec(select(Candidate).where(Candidate.name == cand.name, Candidate.category_id == cand.category_id)).first()
            if not existing:
                session.add(cand)
                print(f"  + Added Candidate: {cand.name}")

        session.commit()
        print("✅ Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
