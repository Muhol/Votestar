from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, and_, desc, delete, update
from sqlalchemy.orm import selectinload
from app.core.database import get_session
from app.core.auth import get_current_user, resolve_user
from app.models.generic import (
    User, Conversation, ConversationParticipant, Message, 
    ConversationType, ConversationRole, UserBlock, MessageLike
)
from typing import List, Optional
import uuid
from pydantic import BaseModel

router = APIRouter()

# --- Request Models ---
class CreateDMRequest(BaseModel):
    recipient_id: str # UUID or Auth0 ID

class SendMessageRequest(BaseModel):
    content: str
    reply_to_id: Optional[str] = None

# --- Endpoints ---

@router.post("/conversations/dm", response_model=dict)
async def create_or_get_dm(
    request: CreateDMRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Start or retrieve a DIRECT conversation with another user."""
    recipient = await resolve_user(request.recipient_id, session)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    # Check for Blocks
    block_check = select(UserBlock).where(
        or_(
            and_(UserBlock.blocker_id == current_user.id, UserBlock.blocked_id == recipient.id),
            and_(UserBlock.blocker_id == recipient.id, UserBlock.blocked_id == current_user.id)
        )
    )
    if (await session.execute(block_check)).scalar_one_or_none():
         raise HTTPException(status_code=403, detail="Cannot message this user due to blocking settings.")

    # Check if DM exists
    sub_me = select(ConversationParticipant.conversation_id).where(ConversationParticipant.user_id == current_user.id)
    
    query = (
        select(Conversation)
        .join(ConversationParticipant, Conversation.id == ConversationParticipant.conversation_id)
        .where(
            Conversation.type == ConversationType.DIRECT,
            ConversationParticipant.user_id == recipient.id,
            Conversation.id.in_(sub_me)
        )
    )
    
    # Use first() instead of scalar_one_or_none() to prevent 500s if duplicates somehow exist
    existing_conv = (await session.execute(query)).scalars().first()
    
    if existing_conv:
        return {"id": str(existing_conv.id), "is_new": False}

    # Create new DM
    new_conv = Conversation(type=ConversationType.DIRECT)
    session.add(new_conv)
    await session.flush() # Get ID

    part_me = ConversationParticipant(conversation_id=new_conv.id, user_id=current_user.id, role=ConversationRole.ADMIN)
    part_other = ConversationParticipant(conversation_id=new_conv.id, user_id=recipient.id, role=ConversationRole.ADMIN)
    
    session.add(part_me)
    session.add(part_other)
    await session.commit()
    await session.refresh(new_conv)
    
    return {"id": str(new_conv.id), "is_new": True}


@router.get("/conversations/unread-count")
async def get_unread_count(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get total unread message count across all conversations."""
    # Get all conversation IDs where user is participant
    conv_query = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == current_user.id
    )
    conv_ids = (await session.execute(conv_query)).scalars().all()
    
    if not conv_ids:
        return {"unread_count": 0, "conversations_with_unread": 0}
    
    # Count unread messages (from others, not read)
    unread_query = select(func.count()).where(
        Message.conversation_id.in_(conv_ids),
        Message.sender_id != current_user.id,
        Message.status != 'read'
    )
    total_unread = (await session.execute(unread_query)).scalar() or 0
    
    # Count conversations with unread messages
    conv_with_unread_query = select(func.count(func.distinct(Message.conversation_id))).where(
        Message.conversation_id.in_(conv_ids),
        Message.sender_id != current_user.id,
        Message.status != 'read'
    )
    conv_with_unread = (await session.execute(conv_with_unread_query)).scalar() or 0
    
    return {"unread_count": total_unread, "conversations_with_unread": conv_with_unread}


@router.get("/conversations")
async def get_inbox(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all conversations for the current user."""
    query = (
        select(Conversation, ConversationParticipant)
        .join(ConversationParticipant, Conversation.id == ConversationParticipant.conversation_id)
        .where(ConversationParticipant.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    
    results = (await session.execute(query)).all()
    
    inbox_items = []
    for conv, part in results:
        # Count unread messages (messages from others that aren't read)
        unread_query = select(func.count()).where(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.status != 'read'
        )
        unread_count = (await session.execute(unread_query)).scalar() or 0
        
        item = {
            "id": conv.id,
            "type": conv.type,
            "updated_at": conv.updated_at,
            "unread": unread_count > 0,
            "unread_count": unread_count,
            "name": conv.name,
            "avatar": None,
             # Last message preview could be fetched here or stored on conv
            "last_message_preview": "View conversation" 
        }
        
        # Fetch last message content for preview
        last_msg_query = select(Message).where(Message.conversation_id == conv.id).order_by(Message.timestamp.desc()).limit(1)
        last_msg = (await session.execute(last_msg_query)).scalar_one_or_none()
        if last_msg:
             content = last_msg.content
             item["last_message_preview"] = content[:50] + "..." if len(content) > 50 else content
             item["last_message_status"] = last_msg.status
             item["last_message_is_me"] = last_msg.sender_id == current_user.id

        if conv.type == ConversationType.DIRECT:
            other_part_query = (
                select(User)
                .join(ConversationParticipant, User.id == ConversationParticipant.user_id)
                .where(
                    ConversationParticipant.conversation_id == conv.id,
                    User.id != current_user.id
                )
            )
            other_user = (await session.execute(other_part_query)).scalar_one_or_none()
            if other_user:
                item["name"] = other_user.name or other_user.email.split('@')[0]
                item["other_user_id"] = other_user.id
        
        inbox_items.append(item)
        
    return inbox_items


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get message history with likes and replies."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    membership_check = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conv_uuid,
        ConversationParticipant.user_id == current_user.id
    )
    if not (await session.execute(membership_check)).scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    # Fetch messages + sender info
    # We also need likes count and if current user liked it
    # AND reply_to info... this is getting heavy for a single query.
    # For now, let's keep it simple and maybe do n+1 for likes or use subqueries if needed.
    
    query = (
        select(Message, User.email, User.name)
        .join(User, Message.sender_id == User.id)
        .where(Message.conversation_id == conv_uuid)
        .order_by(Message.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    
    results = (await session.execute(query)).all()
    
    # Collect message IDs to batch fetch likes and replies
    message_ids = [r[0].id for r in results]
    
    # Batch Fetch Likes
    likes_query = (
        select(MessageLike.message_id, func.count(MessageLike.id))
        .where(MessageLike.message_id.in_(message_ids))
        .group_by(MessageLike.message_id)
    )
    likes_counts = dict((await session.execute(likes_query)).all())
    
    my_likes_query = select(MessageLike.message_id).where(
        MessageLike.message_id.in_(message_ids),
        MessageLike.user_id == current_user.id
    )
    my_likes = set((await session.execute(my_likes_query)).scalars().all())

    # Batch Fetch Reply Content (if we need to show "Replied to: ...")
    # For now, frontend might just need the ID to scroll to it, or show a snippet.
    # Let's fetch the reply parent content.
    reply_ids = [r[0].reply_to_id for r in results if r[0].reply_to_id]
    reply_map = {}
    if reply_ids:
        reply_content_query = select(Message.id, Message.content, User.name).join(User, Message.sender_id == User.id).where(Message.id.in_(reply_ids))
        reply_rows = (await session.execute(reply_content_query)).all()
        for rid, rcontent, rname in reply_rows:
            reply_map[rid] = {"content": rcontent, "sender_name": rname}

    messages = []
    for msg, email, name in results:
        sender_name = name or email.split('@')[0]
        
        reply_info = None
        if msg.reply_to_id and msg.reply_to_id in reply_map:
             reply_info = {
                 "id": msg.reply_to_id,
                 "content": reply_map[msg.reply_to_id]["content"],
                 "sender_name": reply_map[msg.reply_to_id]["sender_name"]
             }

        messages.append({
            "id": msg.id,
            "content": msg.content,
            "timestamp": msg.timestamp,
            "is_edited": msg.is_edited,
            "sender_id": msg.sender_id,
            "sender_name": sender_name,
            "is_me": msg.sender_id == current_user.id,
            "likes_count": likes_counts.get(msg.id, 0),
            "is_liked": msg.id in my_likes,
            "reply_to": reply_info,
            "status": msg.status or "sent"
        })
        
    return messages[::-1]


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Send a message, optionally replying to another."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    part_query = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conv_uuid,
        ConversationParticipant.user_id == current_user.id
    )
    participant = (await session.execute(part_query)).scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    reply_uuid = None
    if payload.reply_to_id:
        try:
            reply_uuid = uuid.UUID(payload.reply_to_id)
        except:
            pass # Ignore invalid reply IDs

    new_msg = Message(
        conversation_id=conv_uuid,
        sender_id=current_user.id,
        content=payload.content,
        reply_to_id=reply_uuid
    )
    session.add(new_msg)
    
    conv = await session.get(Conversation, conv_uuid)
    if conv:
        conv.updated_at = func.now()
        session.add(conv)
        
    await session.commit()
    await session.refresh(new_msg)
    
    # Real-time sync now handled by Firebase Firestore on the client side
    
    return {
        "id": str(new_msg.id),
        "content": new_msg.content,
        "timestamp": new_msg.timestamp.isoformat(),
        "status": new_msg.status
    }

@router.post("/messages/{message_id}/like")
async def like_message(
    message_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Toggle like on a message."""
    try:
        msg_uuid = uuid.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    # Check if message exists and user has access to conversation
    msg = await session.get(Message, msg_uuid)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    # Verify participation
    membership = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == msg.conversation_id,
        ConversationParticipant.user_id == current_user.id
    )
    if not (await session.execute(membership)).scalar_one_or_none():
         raise HTTPException(status_code=403, detail="Access denied")

    # Check existing like
    existing_like = await session.execute(
        select(MessageLike).where(
            MessageLike.message_id == msg_uuid,
            MessageLike.user_id == current_user.id
        )
    )
    like_obj = existing_like.scalar_one_or_none()
    
    if like_obj:
        await session.delete(like_obj)
        liked = False
    else:
        new_like = MessageLike(message_id=msg_uuid, user_id=current_user.id)
        session.add(new_like)
        liked = True
        
    await session.commit()
    
    return {"status": "toggled", "liked": liked}


@router.post("/conversations/{conversation_id}/read")
async def mark_messages_read(
    conversation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Mark all messages from other users as read."""
    from datetime import datetime
    
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    
    # Verify participation
    membership = await session.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id == current_user.id
        )
    )
    if not membership.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update all unread messages from OTHER users to 'read'
    from sqlalchemy import update
    stmt = (
        update(Message)
        .where(
            Message.conversation_id == conv_uuid,
            Message.sender_id != current_user.id,
            Message.status != 'read'
        )
        .values(status='read', read_at=datetime.utcnow())
    )
    result = await session.execute(stmt)
    await session.commit()
    
    return {"updated": result.rowcount}

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation entirely."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Verify participation and ownership/admin status
    part_query = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conv_uuid,
        ConversationParticipant.user_id == current_user.id
    )
    participant = (await session.execute(part_query)).scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    # For now, allow any participant to delete conversation (simple model)
    # In a more strict model, we might only allow ADMINs.
    
    # 1. Delete Message Likes
    msg_ids_query = select(Message.id).where(Message.conversation_id == conv_uuid)
    msg_ids = (await session.execute(msg_ids_query)).scalars().all()
    if msg_ids:
        await session.execute(delete(MessageLike).where(MessageLike.message_id.in_(msg_ids)))

    # 2. Delete Messages
    await session.execute(delete(Message).where(Message.conversation_id == conv_uuid))

    # 3. Delete Participants
    await session.execute(delete(ConversationParticipant).where(ConversationParticipant.conversation_id == conv_uuid))

    # 4. Delete Conversation
    await session.execute(delete(Conversation).where(Conversation.id == conv_uuid))

    await session.commit()
    return {"status": "deleted"}


@router.delete("/conversations/{conversation_id}/clear")
async def clear_conversation(
    conversation_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Clear all messages in a conversation."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    part_query = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conv_uuid,
        ConversationParticipant.user_id == current_user.id
    )
    if not (await session.execute(part_query)).scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a participant")

    # 1. Delete Message Likes
    msg_ids_query = select(Message.id).where(Message.conversation_id == conv_uuid)
    msg_ids = (await session.execute(msg_ids_query)).scalars().all()
    if msg_ids:
        await session.execute(delete(MessageLike).where(MessageLike.message_id.in_(msg_ids)))

    # 2. Delete Messages
    await session.execute(delete(Message).where(Message.conversation_id == conv_uuid))

    # Update conversation's updated_at
    conv = await session.get(Conversation, conv_uuid)
    if conv:
        conv.updated_at = func.now()
        session.add(conv)

    await session.commit()
    return {"status": "cleared"}
