from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.core.database import get_session
from app.core.auth import get_current_user, resolve_user
from app.models.generic import User, UserFollow, UserType
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/users/{followed_id}/follow", status_code=status.HTTP_201_CREATED)
async def follow_user(
    followed_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Link two accounts as follower/followed."""
    try:
        target_user = await resolve_user(followed_id, session)
        if not target_user:
            raise HTTPException(status_code=404, detail="Citizen not found.")

        if current_user.id == target_user.id:
            raise HTTPException(status_code=400, detail="Self-following is not permitted.")
        
        # 2. Create Follow Link
        new_follow = UserFollow(follower_id=current_user.id, followed_id=target_user.id)
        session.add(new_follow)
        
        try:
            await session.commit()
            
            # Ensure count is not None before incrementing
            if target_user.follower_count is None:
                target_user.follower_count = 0
                
            target_user.follower_count += 1
            
            # Check for auto-verification
            INFLUENCE_THRESHOLD = 10000
            if target_user.user_type == UserType.ORGANIZATION and not target_user.is_verified_org:
                if target_user.follower_count >= INFLUENCE_THRESHOLD:
                    target_user.is_verified_org = True

            session.add(target_user)
            await session.commit()
            
            return {"status": "following", "follower_count": target_user.follower_count}
        except IntegrityError:
            await session.rollback()
            raise HTTPException(status_code=400, detail="You are already following this citizen.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in follow_user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Social graph update failed: {str(e)}")

@router.delete("/users/{followed_id}/follow")
async def unfollow_user(
    followed_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Break a follower/followed link."""
    target_user = await resolve_user(followed_id, session)
    if not target_user:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    query = select(UserFollow).where(
        UserFollow.follower_id == current_user.id,
        UserFollow.followed_id == target_user.id
    )
    result = await session.execute(query)
    follow_link = result.scalar_one_or_none()
    
    if not follow_link:
        raise HTTPException(status_code=404, detail="No active relationship found.")
    
    await session.delete(follow_link)
    if target_user.follower_count is None:
        target_user.follower_count = 0

    if target_user.follower_count > 0:
        target_user.follower_count -= 1
        session.add(target_user)
        
    await session.commit()
    return {"status": "unfollowed"}

@router.get("/users/{user_id}/followers")
async def get_followers(user_id: str, session: AsyncSession = Depends(get_session)):
    """List IDs of citizens following this account."""
    user = await resolve_user(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    query = select(UserFollow.follower_id).where(UserFollow.followed_id == user.id)
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/users/{user_id}/following")
async def get_following(user_id: str, session: AsyncSession = Depends(get_session)):
    """List IDs of citizens this account is following."""
    user = await resolve_user(user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    query = select(UserFollow.followed_id).where(UserFollow.follower_id == user.id)
    result = await session.execute(query)
    return result.scalars().all()
