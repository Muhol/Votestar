from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_session
from app.core.auth import get_current_user, resolve_user, get_optional_current_user
from app.models.generic import User, UserBase
from typing import Optional
import uuid

router = APIRouter()

@router.get("/users/me", response_model=User)
async def get_me(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Return the current authenticated user with full metadata. Implements Auto-Verification logic."""
    from app.models.generic import UserType
    
    # REACH-BASED AUTO-VERIFICATION
    IFLUENCE_THRESHOLD = 10000
    if (current_user.user_type == UserType.ORGANIZATION and 
        not current_user.is_verified_org and 
        current_user.follower_count >= IFLUENCE_THRESHOLD):
        
        current_user.is_verified_org = True
        session.add(current_user)
        await session.commit()
        await session.refresh(current_user)
        print(f"Auto-Verified Organization: {current_user.email}")

    return current_user

@router.patch("/users/me", response_model=User)
async def update_me(
    user_update: UserBase, 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update profile."""
    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.get("/users/{user_id}/votes")
async def get_user_votes(user_id: str, session: AsyncSession = Depends(get_session)):
    """Return all ledger entries (votes) for a specific citizen (by UUID or Auth0 ID)."""
    from app.models.generic import Vote, Category, Candidate
    
    user = await resolve_user(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found")

    query = (
        select(
            Vote.id,
            Vote.timestamp,
            Vote.vote_hash,
            Category.name.label("category_name"),
            Candidate.name.label("candidate_name")
        )
        .join(Category, Vote.category_id == Category.id)
        .join(Candidate, Vote.candidate_id == Candidate.id)
        .where(Vote.user_id == user.id)
        .order_by(Vote.timestamp.desc())
    )
    result = await session.execute(query)
    return result.mappings().all()

@router.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Return a public profile for any citizen with follow context."""
    user = await resolve_user(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found")

    # Count following
    from app.models.generic import UserFollow, Vote
    following_query = select(func.count(UserFollow.id)).where(UserFollow.follower_id == user.id)
    following_res = await session.execute(following_query)
    following_count = following_res.scalar()

    # Total votes cast
    votes_query = select(func.count(Vote.id)).where(Vote.user_id == user.id)
    votes_res = await session.execute(votes_query)
    total_votes = votes_res.scalar()

    # Check if current user is following this profile
    is_following = False
    if current_user and current_user.id != user.id:
        follow_check = select(UserFollow.id).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.followed_id == user.id
        )
        follow_res = await session.execute(follow_check)
        is_following = follow_res.scalar_one_or_none() is not None

    return {
        "id": str(user.id),
        "name": user.email.split('@')[0], # Display name placeholder
        "user_type": user.user_type,
        "is_verified_org": user.is_verified_org,
        "follower_count": user.follower_count or 0,
        "following_count": following_count or 0,
        "total_votes": total_votes or 0,
        "is_following": is_following,
        "is_me": current_user.id == user.id if current_user else False
    }
