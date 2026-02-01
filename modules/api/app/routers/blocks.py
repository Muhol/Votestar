from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.core.database import get_session
from app.core.auth import get_current_user, resolve_user
from app.models.generic import User, UserBlock
import uuid
from datetime import datetime

router = APIRouter(prefix="/users", tags=["blocks"])

@router.post("/{user_id}/block", status_code=status.HTTP_201_CREATED)
async def block_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Block a user."""
    target_user = await resolve_user(user_id, session)
    if not target_user:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    if current_user.id == target_user.id:
        raise HTTPException(status_code=400, detail="You cannot block yourself.")

    new_block = UserBlock(blocker_id=current_user.id, blocked_id=target_user.id)
    session.add(new_block)
    
    # Auto-unfollow both ways
    from app.models.generic import UserFollow
    unfollow_query = select(UserFollow).where(
        ((UserFollow.follower_id == current_user.id) & (UserFollow.followed_id == target_user.id)) |
        ((UserFollow.follower_id == target_user.id) & (UserFollow.followed_id == current_user.id))
    )
    unfollow_res = await session.execute(unfollow_query)
    for follow in unfollow_res.scalars().all():
        await session.delete(follow)

    try:
        await session.commit()
        return {"status": "blocked", "target_id": target_user.id}
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="Citizen is already blocked.")
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}/block")
async def unblock_user(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Unblock a user."""
    target_user = await resolve_user(user_id, session)
    if not target_user:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    query = select(UserBlock).where(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == target_user.id
    )
    result = await session.execute(query)
    block_link = result.scalar_one_or_none()
    
    if not block_link:
        raise HTTPException(status_code=404, detail="No active block found.")
    
    await session.delete(block_link)
    await session.commit()
    return {"status": "unblocked"}

@router.get("/me/blocks")
async def get_blocked_users(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List citizens blocked by current user with details."""
    query = (
        select(User.id, User.email)
        .join(UserBlock, User.id == UserBlock.blocked_id)
        .where(UserBlock.blocker_id == current_user.id)
    )
    result = await session.execute(query)
    return [{"id": str(row.id), "name": row.email.split('@')[0]} for row in result]
