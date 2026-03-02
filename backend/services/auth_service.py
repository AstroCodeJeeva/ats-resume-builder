
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import bcrypt
from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_sync_db


SECRET_KEY = os.getenv("JWT_SECRET", "")
if not SECRET_KEY:
    # Allow a dev-only fallback when FASTAPI_ENV is not "production"
    if os.getenv("FASTAPI_ENV", "development") == "production":
        raise RuntimeError("JWT_SECRET environment variable must be set in production")
    SECRET_KEY = "dev-only-insecure-key-do-not-use-in-prod"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        # Corrupt or non-bcrypt hash in DB
        return False


def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """FastAPI dependency — extracts and validates the current user from JWT + MongoDB."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user_id = payload["sub"]
    db = get_sync_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token (bad user id)")
    user = db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Same as get_current_user but returns None instead of 401 if not logged in."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload["sub"]
        db = get_sync_db()
        return db.users.find_one({"_id": ObjectId(user_id)})
    except (HTTPException, jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        # Any auth failure → treat as anonymous
        return None
