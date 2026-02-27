"""
ATS Resume Builder — Admin Router
====================================
Admin-only endpoints for user management, stats, and platform oversight.

Default admin credentials:
  Email:    admin@atsbuilder.com
  Password: Admin@123
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends

from database import get_sync_db
from db_models import user_response
from services.auth_service import get_current_user

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user is an admin."""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ──────────────────────────────────────────────────────────

class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None


# ── Dashboard Stats ─────────────────────────────────────────────────

@router.get("/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    """Platform-wide statistics for the admin dashboard."""
    db = get_sync_db()

    total_users = db.users.count_documents({})
    total_resumes = db.saved_resumes.count_documents({})
    optimized_resumes = db.saved_resumes.count_documents({"is_optimized": True})
    total_uploads = db.resume_uploads.count_documents({})

    # Average ATS score
    pipeline = [
        {"$match": {"ats_score": {"$ne": None}}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$ats_score"}}},
    ]
    avg_result = list(db.saved_resumes.aggregate(pipeline))
    avg_ats = round(avg_result[0]["avg_score"], 1) if avg_result else 0

    # Recent signups (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_signups = db.users.count_documents({"created_at": {"$gte": week_ago}})

    # Score distribution
    score_ranges = {
        "excellent": db.saved_resumes.count_documents({"ats_score": {"$gte": 80}}),
        "good": db.saved_resumes.count_documents({"ats_score": {"$gte": 60, "$lt": 80}}),
        "fair": db.saved_resumes.count_documents({"ats_score": {"$gte": 40, "$lt": 60}}),
        "poor": db.saved_resumes.count_documents({"ats_score": {"$lt": 40, "$ne": None}}),
    }

    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "optimized_resumes": optimized_resumes,
        "total_uploads": total_uploads,
        "avg_ats_score": avg_ats,
        "recent_signups": recent_signups,
        "score_distribution": score_ranges,
    }


# ── User Management ─────────────────────────────────────────────────

@router.get("/users")
def list_users(admin: dict = Depends(require_admin)):
    """List all users with resume counts."""
    db = get_sync_db()
    users = list(db.users.find().sort("created_at", -1))
    result = []
    for u in users:
        data = user_response(u)
        data["is_admin"] = u.get("is_admin", False)
        data["resume_count"] = db.saved_resumes.count_documents({"user_id": str(u["_id"])})
        data["upload_count"] = db.resume_uploads.count_documents({"user_id": str(u["_id"])})
        result.append(data)
    return result


@router.put("/users/{user_id}")
def update_user(user_id: str, body: UpdateUserRequest, admin: dict = Depends(require_admin)):
    """Update a user's details (admin can promote/demote)."""
    db = get_sync_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = {}
    if body.username is not None:
        updates["username"] = body.username
    if body.email is not None:
        updates["email"] = body.email
    if body.is_admin is not None:
        updates["is_admin"] = body.is_admin

    if updates:
        db.users.update_one({"_id": oid}, {"$set": updates})

    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """Delete a user and all their resumes/uploads."""
    db = get_sync_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    # Don't allow deleting yourself
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user = db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user's data
    db.saved_resumes.delete_many({"user_id": user_id})
    db.resume_uploads.delete_many({"user_id": user_id})
    db.users.delete_one({"_id": oid})

    return {"message": "User and all associated data deleted"}


# ── All Resumes (admin view) ────────────────────────────────────────

@router.get("/resumes")
def list_all_resumes(admin: dict = Depends(require_admin)):
    """List all resumes across all users."""
    db = get_sync_db()
    cursor = db.saved_resumes.find().sort("updated_at", -1).limit(100)
    result = []
    for doc in cursor:
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])}) if doc.get("user_id") else None
        result.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", "Untitled"),
            "ats_score": doc.get("ats_score"),
            "template": doc.get("template", "classic"),
            "target_role": doc.get("target_role", ""),
            "is_optimized": doc.get("is_optimized", False),
            "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else "",
            "username": user["username"] if user else "Unknown",
        })
    return result


# ── All Uploads (admin view) ────────────────────────────────────────

@router.get("/uploads")
def list_all_uploads(admin: dict = Depends(require_admin)):
    """List all resume uploads across all users."""
    db = get_sync_db()
    cursor = db.resume_uploads.find().sort("uploaded_at", -1).limit(100)
    result = []
    for doc in cursor:
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])}) if doc.get("user_id") else None
        result.append({
            "id": str(doc["_id"]),
            "filename": doc.get("filename", ""),
            "ats_score": doc.get("ats_score"),
            "uploaded_at": doc["uploaded_at"].isoformat() if doc.get("uploaded_at") else "",
            "username": user["username"] if user else "Unknown",
            "predicted_jobs": doc.get("predicted_jobs", []),
        })
    return result
