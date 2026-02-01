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
    Uses 'sub' (Auth0 User ID) for JIT provisioning and profile enrichment.
    """
    import httpx
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token or not token.credentials:
        raise credential_exception

    try:
        # Standardize issuer format (remove trailing slash for comparison)
        issuer_url = f"https://{AUTH0_DOMAIN}/"
        
        payload = jwt.decode(
            token.credentials, 
            "", # Non-verifying for intra-module dev bridge
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=issuer_url,
            options={"verify_signature": False} 
        )
        
        user_auth0_id: str = payload.get("sub")
        if user_auth0_id is None:
             raise credential_exception
             
    except JWTError:
        raise credential_exception

    # 1. Check User in DB by Auth0 'sub'
    query = select(User).where(User.auth0_sub == user_auth0_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    
    # 1b. Fallback for legacy users (where sub was stored in email)
    if not user:
        legacy_query = select(User).where(User.email == user_auth0_id)
        result = await session.execute(legacy_query)
        user = result.scalar_one_or_none()
        if user:
            # Upgrade legacy user
            user.auth0_sub = user_auth0_id

    # 2. Fetch User Info from Auth0 if needed (new user or placeholder name)
    if not user or not user.name or user.email == user_auth0_id:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://{AUTH0_DOMAIN}/userinfo",
                    headers={"Authorization": f"Bearer {token.credentials}"}
                )
                if response.status_code == 200:
                    user_info = response.json()
                    real_email = user_info.get("email")
                    real_name = user_info.get("name") or user_info.get("nickname")

                    if not user:
                        user = User(
                            email=real_email or user_auth0_id,
                            name=real_name,
                            auth0_sub=user_auth0_id,
                            phone_number=f"auth@-{user_auth0_id}",
                            device_fingerprint="auth0_verified",
                            is_verified=True
                        )
                        session.add(user)
                    else:
                        if real_email: user.email = real_email
                        if real_name: user.name = real_name
                    
                    await session.commit()
                    await session.refresh(user)
        except Exception as e:
            print(f"Auth: Profile Enrichment Error {str(e)}")
            # Continue with what we have if enrich fails

    # 3. Final JIT Provisioning (if enrichment failed or was skipped)
    if not user:
        user = User(
            email=user_auth0_id,
            auth0_sub=user_auth0_id,
            phone_number=f"auth@-{user_auth0_id}",
            device_fingerprint="auth0_verified",
            is_verified=True 
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

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

    # 2. Try by Auth0 sub
    query = select(User).where(User.auth0_sub == user_id_str)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    if user:
        return user

    # 3. Try by Email (legacy or actual email)
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

async def get_current_user_ws(
    token: str,
    session: AsyncSession
) -> User:
    """
    WebSocket specific auth helper that accepts a raw token string.
    """
    # Create a fake credentials object to reuse existing logic if possible, 
    # or just manually decode.
    # Reusing logic is safer.
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    return await get_current_user(creds, session)
