import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, UniqueConstraint
from enum import Enum

class UserType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    ORGANIZATION = "ORGANIZATION"

class CategoryType(str, Enum):
    OFFICIAL = "OFFICIAL"
    COMMUNITY = "COMMUNITY"
    AI = "AI"

class CategoryStatus(str, Enum):
    PROPOSAL = "PROPOSAL"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

# Shared properties
class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    phone_number: Optional[str] = Field(default=None)
    is_verified: bool = False
    is_identity_verified: bool = False
    national_id_hash: Optional[str] = Field(default=None, unique=True, index=True)
    # NEW FIELDS
    user_type: UserType = Field(default=UserType.INDIVIDUAL)
    is_verified_org: bool = False
    follower_count: int = Field(default=0)
    subscription_tier: Optional[str] = Field(default="Free")
    device_fingerprint: str

class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryBase(SQLModel):
    name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_active: bool = True
    # NEW FIELDS
    creator_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    category_type: str = Field(default="OFFICIAL")  # Changed from enum to str
    status: str = Field(default="ACTIVE")  # Changed from enum to str
    proposal_signatures: int = Field(default=0)

class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CandidateBase(SQLModel):
    name: str
    bio: Optional[str] = None
    cloudinary_image_url: str

class Candidate(CandidateBase, table=True):
    __tablename__ = "candidates"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    category_id: uuid.UUID = Field(foreign_key="categories.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteBase(SQLModel):
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    category_id: uuid.UUID = Field(foreign_key="categories.id")
    candidate_id: uuid.UUID = Field(foreign_key="candidates.id")
    device_signature: str
    idempotency_key: str = Field(unique=True, index=True)
    vote_hash: Optional[str] = None

class Vote(VoteBase, table=True):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("user_id", "category_id", name="one_vote_per_user_per_category"),)
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CategoryProposalSignature(SQLModel, table=True):
    __tablename__ = "category_proposal_signatures"
    __table_args__ = (UniqueConstraint("user_id", "category_id", name="one_signature_per_user_per_category"),)
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    category_id: uuid.UUID = Field(foreign_key="categories.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserFollow(SQLModel, table=True):
    __tablename__ = "user_follows"
    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="one_follow_per_pair"),)
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    follower_id: uuid.UUID = Field(foreign_key="users.id")
    followed_id: uuid.UUID = Field(foreign_key="users.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    action: str
    resource_id: uuid.UUID
    resource_type: str
    details: Optional[str] = None # storing JSON as string for simplicity in SQLModel for now, or use sa_column
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
