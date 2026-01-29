from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_session
from app.core.auth import get_optional_current_user
from app.models.generic import Category, Candidate, Vote, User
from typing import Optional
import uuid

router = APIRouter()

@router.get("/categories")
async def list_categories(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
    is_active: bool = True
):
    """List all election categories with has_voted context."""
    query = select(Category).where(Category.is_active == is_active)
    result = await session.execute(query)
    categories = result.scalars().all()
    
    if not current_user:
        return [dict(cat) for cat in categories]

    # Check which categories current user has voted in
    voted_query = select(Vote.category_id).where(Vote.user_id == current_user.id)
    voted_result = await session.execute(voted_query)
    voted_ids = set(voted_result.scalars().all())

    enriched = []
    for cat in categories:
        cat_dict = dict(cat)
        cat_dict["has_voted"] = cat.id in voted_ids
        enriched.append(cat_dict)
    
    return enriched

@router.get("/categories/{category_id}")
async def get_category(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get category details with has_voted context."""
    query = select(Category).where(Category.id == category_id)
    result = await session.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    cat_dict = dict(category)
    cat_dict["has_voted"] = False
    
    if current_user:
        voted_query = select(Vote.id).where(
            Vote.user_id == current_user.id, 
            Vote.category_id == category_id
        )
        voted_result = await session.execute(voted_query)
        cat_dict["has_voted"] = voted_result.scalar_one_or_none() is not None
        
    return cat_dict

@router.get("/categories/{category_id}/candidates", response_model=list[Candidate])
async def list_candidates(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_session)
):
    """List all candidates for a specific category."""
    query = select(Candidate).where(Candidate.category_id == category_id)
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/categories/{category_id}/leaderboard")
async def get_leaderboard(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get the current vote counts with user-vote context."""
    query = (
        select(
            Candidate.id,
            Candidate.name,
            func.count(Vote.id).label("total_votes")
        )
        .outerjoin(Vote, Candidate.id == Vote.candidate_id)
        .where(Candidate.category_id == category_id)
        .group_by(Candidate.id, Candidate.name)
        .order_by(func.count(Vote.id).desc())
    )
    
    result = await session.execute(query)
    rows = result.all()
    total_category_votes = sum(row.total_votes for row in rows)

    # Check user's specific vote in this category
    user_voted_candidate_id = None
    if current_user:
        v_query = select(Vote.candidate_id).where(
            Vote.user_id == current_user.id, 
            Vote.category_id == category_id
        )
        v_result = await session.execute(v_query)
        user_voted_candidate_id = v_result.scalar_one_or_none()
    
    leaderboard = []
    for i, row in enumerate(rows):
        percentage = (row.total_votes / total_category_votes * 100) if total_category_votes > 0 else 0
        leaderboard.append({
            "rank": i + 1,
            "candidate_id": row.id,
            "name": row.name,
            "votes": row.total_votes,
            "percentage": round(percentage, 1),
            "user_voted_for": row.id == user_voted_candidate_id
        })
        
    return {
        "category_id": category_id,
        "total_votes": total_category_votes,
        "leaderboard": leaderboard,
        "has_voted": user_voted_candidate_id is not None
    }
