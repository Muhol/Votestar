from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.core.database import get_session
from app.core.auth import get_current_user, get_optional_current_user
from app.models.generic import Category, CategoryBase, User, CategoryStatus, CategoryType, CategoryProposalSignature
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter()

SIGNATURE_THRESHOLD = 50 

@router.post("/proposals", response_model=Category, status_code=status.HTTP_201_CREATED)
async def propose_category(
    category_in: CategoryBase,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Propose a new category. 
    Organizations: Instant activation.
    Individuals: Requires 50 signatures.
    """
    from app.models.generic import UserType
    
    new_category = Category(**category_in.model_dump())
    new_category.creator_id = current_user.id
    new_category.category_type = CategoryType.COMMUNITY
    
    if current_user.user_type == UserType.ORGANIZATION:
        new_category.status = CategoryStatus.ACTIVE
        new_category.is_active = True
        new_category.proposal_signatures = 0 
    else:
        new_category.status = CategoryStatus.PROPOSAL
        new_category.is_active = False
        new_category.proposal_signatures = 1 
        
        first_sig = CategoryProposalSignature(
            user_id=current_user.id,
            category_id=new_category.id
        )
        session.add(first_sig)

    session.add(new_category)
    await session.commit()
    await session.refresh(new_category)
    
    return new_category

@router.get("/proposals")
async def list_proposals(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all pending proposals with has_signed context."""
    try:
        query = (
            select(
                Category, 
                User.email.label("creator_name"),
                User.user_type.label("creator_type"),
                User.is_verified_org.label("creator_verified")
            )
            .outerjoin(User, Category.creator_id == User.id)
            .where(Category.status == 'PROPOSAL')
        )
        result = await session.execute(query)
        
        # Check current user's signatures
        signed_ids = set()
        if current_user:
            sig_query = select(CategoryProposalSignature.category_id).where(
                CategoryProposalSignature.user_id == current_user.id
            )
            sig_result = await session.execute(sig_query)
            signed_ids = set(sig_result.scalars().all())

        proposals = []
        for row in result.all():
            cat = row.Category
            proposals.append({
                "id": str(cat.id),
                "name": cat.name,
                "description": cat.description,
                "start_time": cat.start_time.isoformat() if cat.start_time else None,
                "end_time": cat.end_time.isoformat() if cat.end_time else None,
                "is_active": cat.is_active,
                "creator_id": str(cat.creator_id) if cat.creator_id else None,
                "category_type": cat.category_type,
                "status": cat.status,
                "proposal_signatures": cat.proposal_signatures,
                "created_at": cat.created_at.isoformat() if cat.created_at else None,
                "creator_name": row.creator_name.split('@')[0] if row.creator_name else "System",
                "creator_type": row.creator_type if row.creator_type else "INDIVIDUAL",
                "creator_verified": row.creator_verified if row.creator_verified is not None else False,
                "has_signed": cat.id in signed_ids
            })
        return proposals
    except Exception as e:
        print(f"Error in list_proposals: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch proposals: {str(e)}")

@router.get("/proposals/{category_id}")
async def get_proposal(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get details for a single proposal including recent supporters."""
    try:
        query = (
            select(
                Category, 
                User.email.label("creator_name"),
                User.user_type.label("creator_type"),
                User.is_verified_org.label("creator_verified")
            )
            .outerjoin(User, Category.creator_id == User.id)
            .where(Category.id == category_id)
        )
        result = await session.execute(query)
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        cat = row.Category
        
        # Check current user signature
        has_signed = False
        if current_user:
            sig_check = select(CategoryProposalSignature.id).where(
                CategoryProposalSignature.user_id == current_user.id,
                CategoryProposalSignature.category_id == category_id
            )
            sig_res = await session.execute(sig_check)
            has_signed = sig_res.scalar_one_or_none() is not None

        # Fetch recent supporters (latest 12 for the grid)
        supporters_query = (
            select(User.id, User.email)
            .join(CategoryProposalSignature, User.id == CategoryProposalSignature.user_id)
            .where(CategoryProposalSignature.category_id == category_id)
            .order_by(CategoryProposalSignature.timestamp.desc())
            .limit(12)
        )
        sup_result = await session.execute(supporters_query)
        supporters = []
        for s_id, s_email in sup_result.all():
            supporters.append({
                "id": str(s_id),
                "name": s_email.split('@')[0]
            })

        return {
            "id": str(cat.id),
            "name": cat.name,
            "description": cat.description,
            "start_time": cat.start_time.isoformat() if cat.start_time else None,
            "end_time": cat.end_time.isoformat() if cat.end_time else None,
            "is_active": cat.is_active,
            "creator_id": str(cat.creator_id) if cat.creator_id else None,
            "category_type": cat.category_type,
            "status": cat.status,
            "proposal_signatures": cat.proposal_signatures,
            "created_at": cat.created_at.isoformat() if cat.created_at else None,
            "creator_name": row.creator_name.split('@')[0] if row.creator_name else "System",
            "creator_type": row.creator_type if row.creator_type else "INDIVIDUAL",
            "creator_verified": row.creator_verified if row.creator_verified is not None else False,
            "has_signed": has_signed,
            "supporters": supporters
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_proposal: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch proposal details")

@router.post("/proposals/{category_id}/sign", status_code=status.HTTP_200_OK)
async def sign_proposal(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Support a category proposal. 
    If threshold is reached, category becomes ACTIVE.
    """
    from app.models.generic import UserType
    if current_user.user_type == UserType.ORGANIZATION:
        raise HTTPException(status_code=403, detail="Organizations cannot sign proposals.")

    # 1. Check if proposal exists
    category = await session.get(Category, category_id)
    if not category or category.status != CategoryStatus.PROPOSAL:
        raise HTTPException(status_code=404, detail="Proposal not found or already active.")

    # 2. Add signature
    new_sig = CategoryProposalSignature(user_id=current_user.id, category_id=category_id)
    session.add(new_sig)
    
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="You have already supported this proposal.")

    # 3. Update count and check threshold
    category.proposal_signatures += 1
    
    if category.proposal_signatures >= SIGNATURE_THRESHOLD:
        category.status = CategoryStatus.ACTIVE
        category.is_active = True
        # In a real app, maybe set start_time to now
        category.start_time = datetime.utcnow()
    
    session.add(category)
    await session.commit()
    await session.refresh(category)
    
    return {"status": category.status, "signatures": category.proposal_signatures}
