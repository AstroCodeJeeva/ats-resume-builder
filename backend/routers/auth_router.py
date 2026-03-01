
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, Request

from database import get_sync_db
from db_models import user_doc, user_response
from rate_limiter import limiter
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
import bcrypt

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = Field(None, min_length=5, max_length=120)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)


class SetSecurityQuestionRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=200)
    answer: str = Field(..., min_length=2, max_length=100)


class ForgotPasswordRequest(BaseModel):
    email: str
    answer: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=100)


@router.post("/register", response_model=AuthResponse)
@limiter.limit("5/minute")
def register(body: RegisterRequest, request: Request):
    """Create a new user account."""
    db = get_sync_db()

    # Check duplicates
    if db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = user_doc(body.username, body.email, hash_password(body.password))
    result = db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    token = create_access_token(user_id, body.username)
    return AuthResponse(
        token=token,
        user={"id": user_id, "username": body.username, "email": body.email, "is_admin": False},
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(body: LoginRequest, request: Request):
    """Login with email + password."""
    db = get_sync_db()
    user = db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["username"])
    return AuthResponse(
        token=token,
        user={"id": user_id, "username": user["username"], "email": user["email"], "is_admin": user.get("is_admin", False)},
    )


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile with resume count."""
    db = get_sync_db()
    resume_count = db.saved_resumes.count_documents({"user_id": str(current_user["_id"])})
    upload_count = db.resume_uploads.count_documents({"user_id": str(current_user["_id"])})
    resp = user_response(current_user)
    resp["resume_count"] = resume_count
    resp["upload_count"] = upload_count
    return resp


@router.put("/profile")
def update_profile(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    """Update current user's username and/or email."""
    db = get_sync_db()
    updates = {}

    if body.username and body.username != current_user["username"]:
        if db.users.find_one({"username": body.username, "_id": {"$ne": current_user["_id"]}}):
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = body.username

    if body.email and body.email != current_user["email"]:
        if db.users.find_one({"email": body.email, "_id": {"$ne": current_user["_id"]}}):
            raise HTTPException(status_code=400, detail="Email already registered")
        updates["email"] = body.email

    if not updates:
        return {"message": "No changes to save"}

    db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})

    # Return updated user
    updated = db.users.find_one({"_id": current_user["_id"]})
    resp = user_response(updated)
    return {"message": "Profile updated successfully", "user": resp}


@router.put("/change-password")
def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Change the current user's password."""
    if not verify_password(body.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    db = get_sync_db()
    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}},
    )
    return {"message": "Password changed successfully"}


@router.put("/security-question")
def set_security_question(body: SetSecurityQuestionRequest, current_user: dict = Depends(get_current_user)):
    """Set or update the user's security question (for password reset)."""
    db = get_sync_db()
    hashed_answer = bcrypt.hashpw(
        body.answer.strip().lower().encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "security_question": body.question,
            "security_answer": hashed_answer,
        }},
    )
    return {"message": "Security question set successfully"}


@router.post("/forgot-password/question")
def get_security_question(body: dict):
    """Return the security question for a given email (no auth required)."""
    email = body.get("email", "")
    db = get_sync_db()
    user = db.users.find_one({"email": email})
    # Return a generic message whether or not the email exists to prevent enumeration
    if not user or not user.get("security_question"):
        raise HTTPException(status_code=400, detail="No security question found for this account")
    return {"question": user["security_question"]}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(body: ForgotPasswordRequest, request: Request):
    """Reset password by answering security question."""
    db = get_sync_db()
    user = db.users.find_one({"email": body.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    stored_answer = user.get("security_answer", "")
    if not stored_answer:
        raise HTTPException(status_code=400, detail="No security question set for this account")

    # Compare hashed answer (supports both legacy plaintext and bcrypt hashed)
    candidate = body.answer.strip().lower().encode("utf-8")
    try:
        answer_matches = bcrypt.checkpw(candidate, stored_answer.encode("utf-8"))
    except (ValueError, TypeError):
        # Legacy plaintext fallback
        answer_matches = body.answer.strip().lower() == stored_answer

    if not answer_matches:
        raise HTTPException(status_code=400, detail="Incorrect answer to security question")

    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}},
    )
    return {"message": "Password reset successfully. You can now sign in."}
