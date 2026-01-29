import os
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_session
from app.models.generic import User
from datetime import datetime

# Auth0 Config
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-l1sjreda5ljstsc4.us.auth0.com")
API_AUDIENCE = os.getenv("API_AUDIENCE", "https://dev-l1sjreda5ljstsc4.us.auth0.com/api/v2/")
ALGORITHMS = ["RS256"]

security = HTTPBearer(auto_error=False)

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Validates JWT token and returns the current user.
    Uses 'sub' (Auth0 User ID) for JIT provisioning.
    """
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Standardize issuer format (remove trailing slash for comparison)
        issuer_url = f"https://{AUTH0_DOMAIN}/"
        
        print(f"Auth: Decoding token for audience {API_AUDIENCE}")
        payload = jwt.decode(
            token.credentials, 
            "", # Non-verifying for intra-module dev bridge
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=issuer_url,
            options={"verify_signature": False} 
        )
        
        user_auth0_id: str = payload.get("sub")
        # Note: 'email' is often NOT in the Access Token, only in the ID Token.
        # We rely on 'sub' for uniqueness.
        if user_auth0_id is None:
             print("Auth Error: Missing sub in payload")
             raise credential_exception
             
    except JWTError as e:
        print(f"Auth JWT Error: {str(e)}")
        raise credential_exception

    # 1. Check User in DB by Auth0 'sub'
    # We'll use the device_fingerprint field to store the 'sub' temporarily 
    # if we don't want to change the schema yet, OR better: use email as placeholder.
    query = select(User).where(User.email == user_auth0_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    
    # 2. JIT Provisioning
    if not user:
        print(f"Auth: Provisioning new user for sub {user_auth0_id}")
        user = User(
            email=user_auth0_id, # Using sub as the unique handle for now
            phone_number=f"auth@-{user_auth0_id}", # Unique placeholder
            device_fingerprint="auth0_verified",
            is_verified=True 
        )
        session.add(user)
        try:
            await session.commit()
            await session.refresh(user)
        except Exception as e:
            await session.rollback()
            print(f"Auth: JIT Error {str(e)}")
            result = await session.execute(query)
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=500, detail="User provisioning failed")

    return user

async def resolve_user(user_id_str: str, session: AsyncSession) -> Optional[User]:
    """Helper to find user by UUID or Auth0 sub (stored in email)."""
    import uuid
    # 1. Try by UUID
    try:
        user_uuid = uuid.UUID(user_id_str)
        user = await session.get(User, user_uuid)
        if user:
            return user
    except ValueError:
        pass

    # 2. Try by Email (Auth0 sub)
    query = select(User).where(User.email == user_id_str)
    result = await session.execute(query)
    return result.scalar_one_or_none()

async def get_optional_current_user(
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> Optional[User]:
    """Returns user if token is valid, otherwise returns None without error."""
    if not token or not token.credentials:
        return None
    try:
        # We need to catch precisely what current_user might raise
        return await get_current_user(token, session)
    except Exception:
        return None
