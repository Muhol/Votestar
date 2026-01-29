from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.core.database import get_session
from app.core.auth import get_current_user
from app.models.generic import Vote, VoteBase, User, AuditLog

router = APIRouter()

@router.post("/votes", response_model=Vote, status_code=status.HTTP_201_CREATED)
async def cast_vote(
    vote_in: VoteBase, 
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Cast a vote. Idempotent endpoint.
    Ensures atomic transaction for Vote + AuditLog + Integrity Hash.
    """
    import hashlib
    import json
    
    # Security: Ensure only INDIVIDUALS can vote
    from app.models.generic import UserType
    if current_user.user_type == UserType.ORGANIZATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account Restriction: Only verified individuals can cast votes on the Star Wall."
        )

    # Force the user_id from the authenticated token
    vote_in.user_id = current_user.id
    
    # 1. Idempotency Check
    query = select(Vote).where(Vote.idempotency_key == vote_in.idempotency_key)
    result = await session.execute(query)
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        return existing_vote

    # 2. Create new vote object
    new_vote = Vote(**vote_in.model_dump())
    
    # 3. Generate Integrity Hash (SHA-256)
    # In production, this would include the previous block's hash
    hash_payload = f"{new_vote.user_id}:{new_vote.candidate_id}:{new_vote.idempotency_key}"
    new_vote.vote_hash = hashlib.sha256(hash_payload.encode()).hexdigest()
    
    try:
        # Atomic Transaction starts automatically with session in FastAPI depends? 
        # Actually session is active.
        session.add(new_vote)
        
        # 4. Create Audit Log
        audit_entry = AuditLog(
            user_id=current_user.id,
            action="CAST_VOTE",
            resource_id=new_vote.id,
            resource_type="VOTE",
            details=json.dumps({
                "category_id": str(new_vote.category_id),
                "candidate_id": str(new_vote.candidate_id),
                "hash": new_vote.vote_hash
            })
        )
        session.add(audit_entry)
        
        await session.commit()
        await session.refresh(new_vote)
        return new_vote
        
    except IntegrityError as e:
        await session.rollback()
        # Handle unique constraint for user+category
        if "one_vote_per_user_per_category" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already cast a vote in this category."
            )
        # Handle idempotency race condition
        if "unique_idempotency_key" in str(e).lower():
            query = select(Vote).where(Vote.idempotency_key == vote_in.idempotency_key)
            result = await session.execute(query)
            existing_vote_race = result.scalar_one_or_none()
            if existing_vote_race:
                return existing_vote_race
                
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction failed integrity check")
    except Exception as e:
        await session.rollback()
        print(f"Voting Error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Voting protocol failed")
@router.get("/votes", response_model=list[Vote])
async def list_votes(
    session: AsyncSession = Depends(get_session),
    limit: int = 100,
    offset: int = 0
):
    """List all votes in the ledger."""
    query = select(Vote).offset(offset).limit(limit).order_by(Vote.timestamp.desc())
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/stats/summary")
async def get_summary(session: AsyncSession = Depends(get_session)):
    """Get high-level platform statistics."""
    # In real app, use func.count()
    from sqlalchemy import func
    
    total_votes_query = select(func.count(Vote.id))
    total_votes = await session.execute(total_votes_query)
    
    # Mocking some other stats for now
    return {
        "total_votes": total_votes.scalar(),
        "active_users": 12402,
        "open_elections": 8,
        "revenue": "$12,450"
    }
