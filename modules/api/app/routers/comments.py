from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlmodel import select, desc
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.generic import User, Category, Comment, UserBlock, CommentLike

router = APIRouter(prefix="/comments", tags=["comments"])

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[uuid.UUID] = None

@router.post("/proposals/{proposal_id}", status_code=status.HTTP_201_CREATED)
async def create_comment(
    proposal_id: uuid.UUID,
    comment_in: CommentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # 1. Check if proposal exists
    proposal = await session.get(Category, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # 2. Check if comments are disabled
    if proposal.comments_disabled:
        raise HTTPException(status_code=403, detail="Comments are disabled for this proposal")
    
    # 3. Check blocking
    if proposal.creator_id:
        block_check = await session.execute(
            select(UserBlock).where(
                UserBlock.blocker_id == proposal.creator_id,
                UserBlock.blocked_id == current_user.id
            )
        )
        if block_check.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="You are blocked by the proposal creator")

    # 4. Create comment
    new_comment = Comment(
        user_id=current_user.id,
        category_id=proposal_id,
        content=comment_in.content,
        parent_id=comment_in.parent_id
    )
    session.add(new_comment)
    await session.commit()
    await session.refresh(new_comment)
    
    return {
        "id": str(new_comment.id),
        "content": new_comment.content,
        "userName": current_user.name or current_user.email.split('@')[0],
        "userId": str(current_user.id),
        "auth0Sub": current_user.auth0_sub,
        "timestamp": new_comment.timestamp.isoformat()
    }

@router.get("/proposals/{proposal_id}")
async def get_comments(
    proposal_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # List comments for a proposal with user details, filtering out blocked users
    # And include like counts
    from sqlalchemy import func
    
    # Subquery for like counts
    likes_subquery = (
        select(CommentLike.comment_id, func.count(CommentLike.id).label("likes_count"))
        .group_by(CommentLike.comment_id)
        .subquery()
    )

    # Subquery for whether current user liked it
    user_liked_subquery = (
        select(CommentLike.comment_id)
        .where(CommentLike.user_id == (current_user.id if current_user else None))
        .subquery()
    )

    query = (
        select(
            Comment, 
            User.email, 
            User.name, 
            User.auth0_sub,
            func.coalesce(likes_subquery.c.likes_count, 0).label("likes_count"),
            user_liked_subquery.c.comment_id.isnot(None).label("is_liked")
        )
        .join(User, Comment.user_id == User.id)
        .outerjoin(likes_subquery, Comment.id == likes_subquery.c.comment_id)
        .outerjoin(user_liked_subquery, Comment.id == user_liked_subquery.c.comment_id)
        .where(Comment.category_id == proposal_id)
        .order_by(desc(Comment.timestamp))
    )
    result = await session.execute(query)
    comments_data = result.all()

    # Get blocked relationships to filter
    blocked_ids = set()
    if current_user:
        # Users I blocked
        my_blocks = await session.execute(select(UserBlock.blocked_id).where(UserBlock.blocker_id == current_user.id))
        blocked_ids.update(my_blocks.scalars().all())
        
        # Users who blocked me
        blocks_of_me = await session.execute(select(UserBlock.blocker_id).where(UserBlock.blocked_id == current_user.id))
        blocked_ids.update(blocks_of_me.scalars().all())

    return [
        {
            "id": str(c.id),
            "userId": str(c.user_id),
            "auth0Sub": auth0_sub,
            "userName": name or email.split('@')[0],
            "content": c.content,
            "timestamp": c.timestamp.isoformat(),
            "parentId": str(c.parent_id) if c.parent_id else None,
            "likesCount": likes_count,
            "isLiked": is_liked
        }
        for c, email, name, auth0_sub, likes_count, is_liked in comments_data
        if c.user_id not in blocked_ids
    ]

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    comment = await session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    await session.delete(comment)
    await session.commit()
    return {"status": "deleted"}

@router.post("/{comment_id}/like")
async def toggle_like(
    comment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Toggle a like on a comment."""
    # Check if comment exists
    comment = await session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if already liked
    like_query = select(CommentLike).where(
        CommentLike.user_id == current_user.id,
        CommentLike.comment_id == comment_id
    )
    result = await session.execute(like_query)
    existing_like = result.scalar_one_or_none()
    
    if existing_like:
        await session.delete(existing_like)
        liked = False
    else:
        new_like = CommentLike(user_id=current_user.id, comment_id=comment_id)
        session.add(new_like)
        liked = True
        
    await session.commit()
    
    # Get total count
    count_query = select(func.count(CommentLike.id)).where(CommentLike.comment_id == comment_id)
    count_result = await session.execute(count_query)
    total_likes = count_result.scalar()
    
    return {"liked": liked, "likesCount": total_likes}
