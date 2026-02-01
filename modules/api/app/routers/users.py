from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_session
from app.core.auth import get_current_user, resolve_user, get_optional_current_user
from app.models.generic import User, UserBase, UserBlock
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
async def get_user_votes(
    user_id: str, 
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Return all ledger entries (votes) for a specific citizen (by UUID or Auth0 ID)."""
    from app.models.generic import Vote, Category, Candidate, UserBlock
    
    user = await resolve_user(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found")

    # Check for blocks
    if current_user and current_user.id != user.id:
        # Check if target user blocks current user
        block_query = select(UserBlock.id).where(
            UserBlock.blocker_id == user.id,
            UserBlock.blocked_id == current_user.id
        )
        block_res = await session.execute(block_query)
        if block_res.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Access denied.")

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
    is_blocked = False
    if current_user:
        if current_user.id != user.id:
            # 1. Check Follow
            follow_query = select(UserFollow.id).where(
                UserFollow.follower_id == current_user.id,
                UserFollow.followed_id == user.id
            )
            follow_res = await session.execute(follow_query)
            is_following = follow_res.scalar_one_or_none() is not None

            # 2. Check Blocked by Me
            block_query = select(UserBlock.id).where(
                UserBlock.blocker_id == current_user.id,
                UserBlock.blocked_id == user.id
            )
            block_res = await session.execute(block_query)
            is_blocked = block_res.scalar_one_or_none() is not None

            # 3. Check Blocked Me
            blocked_me_query = select(UserBlock.id).where(
                UserBlock.blocker_id == user.id,
                UserBlock.blocked_id == current_user.id
            )
            blocked_me_res = await session.execute(blocked_me_query)
            if blocked_me_res.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="You do not have permission to view this citizen.")

    return {
        "id": str(user.id),
        "name": user.email.split('@')[0], # Display name placeholder
        "user_type": user.user_type,
        "is_verified_org": user.is_verified_org,
        "follower_count": user.follower_count or 0,
        "following_count": following_count or 0,
        "total_votes": total_votes or 0,
        "is_following": is_following,
        "is_blocked": is_blocked,
        "is_me": current_user.id == user.id if current_user else False
    }


@router.get("/users/search")
async def search_users(
    q: str,
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Search for users by name or email to start a DM."""
    if not q or len(q) < 2:
        return []
    
    # Search by name or email (case-insensitive)
    search_pattern = f"%{q}%"
    query = select(User).where(
        (User.name.ilike(search_pattern)) | (User.email.ilike(search_pattern))
    ).where(
        User.id != current_user.id  # Exclude self
    ).limit(limit)
    
    results = (await session.execute(query)).scalars().all()
    
    # Filter out blocked users
    if results:
        user_ids = [u.id for u in results]
        block_query = select(UserBlock.blocked_id).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id.in_(user_ids)
        )
        blocked_ids = set((await session.execute(block_query)).scalars().all())
        
        # Also filter users who blocked me
        blocked_me_query = select(UserBlock.blocker_id).where(
            UserBlock.blocked_id == current_user.id,
            UserBlock.blocker_id.in_(user_ids)
        )
        blocked_me_ids = set((await session.execute(blocked_me_query)).scalars().all())
        
        results = [u for u in results if u.id not in blocked_ids and u.id not in blocked_me_ids]
    
    return [
        {
            "id": str(u.id),
            "name": u.name or u.email.split('@')[0],
            "email": u.email,
            "user_type": u.user_type,
            "is_verified_org": u.is_verified_org
        }
        for u in results
    ]
