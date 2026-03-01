
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends

from database import get_sync_db
from db_models import user_response
from services.auth_service import get_current_user

router = APIRouter()


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user is an admin."""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None


@router.get("/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    """Platform-wide statistics for the admin dashboard (single aggregation)."""
    db = get_sync_db()

    # Single aggregation pipeline to get all counts + average score + score distribution
    pipeline = [
        {
            "$facet": {
                "totals": [
                    {
                        "$group": {
                            "_id": None,
                            "total": {"$sum": 1},
                            "optimized": {
                                "$sum": {"$cond": [{"$eq": ["$is_optimized", True]}, 1, 0]}
                            },
                        }
                    }
                ],
                "avg_score": [
                    {"$match": {"ats_score": {"$ne": None}}},
                    {"$group": {"_id": None, "avg": {"$avg": "$ats_score"}}},
                ],
                "score_dist": [
                    {"$match": {"ats_score": {"$ne": None}}},
                    {
                        "$bucket": {
                            "groupBy": "$ats_score",
                            "boundaries": [0, 40, 60, 80, 101],
                            "default": "other",
                            "output": {"count": {"$sum": 1}},
                        }
                    },
                ],
            }
        }
    ]
    result = list(db.saved_resumes.aggregate(pipeline))
    facets = result[0] if result else {}

    totals = facets.get("totals", [{}])[0] if facets.get("totals") else {}
    total_resumes = totals.get("total", 0)
    optimized_resumes = totals.get("optimized", 0)

    avg_score_data = facets.get("avg_score", [{}])[0] if facets.get("avg_score") else {}
    avg_ats = round(avg_score_data.get("avg", 0), 1)

    # Parse bucket results into named score ranges
    score_dist_raw = {b["_id"]: b["count"] for b in facets.get("score_dist", []) if b["_id"] != "other"}
    score_ranges = {
        "excellent": score_dist_raw.get(80, 0),
        "good": score_dist_raw.get(60, 0),
        "fair": score_dist_raw.get(40, 0),
        "poor": score_dist_raw.get(0, 0),
    }

    total_users = db.users.count_documents({})
    total_uploads = db.resume_uploads.count_documents({})

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_signups = db.users.count_documents({"created_at": {"$gte": week_ago}})

    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "optimized_resumes": optimized_resumes,
        "total_uploads": total_uploads,
        "avg_ats_score": avg_ats,
        "recent_signups": recent_signups,
        "score_distribution": score_ranges,
    }


@router.get("/users")
def list_users(admin: dict = Depends(require_admin)):
    """List all users with resume counts (batch queries to avoid N+1)."""
    db = get_sync_db()
    users = list(db.users.find().sort("created_at", -1))
    user_ids = [str(u["_id"]) for u in users]

    # Batch count resumes per user
    resume_counts = {}
    for doc in db.saved_resumes.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ]):
        resume_counts[doc["_id"]] = doc["count"]

    # Batch count uploads per user
    upload_counts = {}
    for doc in db.resume_uploads.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ]):
        upload_counts[doc["_id"]] = doc["count"]

    result = []
    for u in users:
        uid = str(u["_id"])
        data = user_response(u)
        data["is_admin"] = u.get("is_admin", False)
        data["resume_count"] = resume_counts.get(uid, 0)
        data["upload_count"] = upload_counts.get(uid, 0)
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


@router.get("/resumes")
def list_all_resumes(admin: dict = Depends(require_admin)):
    """List all resumes across all users (batch user lookup)."""
    db = get_sync_db()
    docs = list(db.saved_resumes.find().sort("updated_at", -1).limit(100))

    # Batch fetch all referenced users in one query
    user_ids = list({ObjectId(d["user_id"]) for d in docs if d.get("user_id")})
    users_map = {str(u["_id"]): u["username"] for u in db.users.find({"_id": {"$in": user_ids}}, {"username": 1})}

    result = []
    for doc in docs:
        result.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", "Untitled"),
            "ats_score": doc.get("ats_score"),
            "template": doc.get("template", "classic"),
            "target_role": doc.get("target_role", ""),
            "is_optimized": doc.get("is_optimized", False),
            "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else "",
            "username": users_map.get(doc.get("user_id", ""), "Unknown"),
        })
    return result


@router.get("/uploads")
def list_all_uploads(admin: dict = Depends(require_admin)):
    """List all resume uploads across all users (batch user lookup)."""
    db = get_sync_db()
    docs = list(db.resume_uploads.find().sort("uploaded_at", -1).limit(100))

    # Batch fetch all referenced users in one query
    user_ids = list({ObjectId(d["user_id"]) for d in docs if d.get("user_id")})
    users_map = {str(u["_id"]): u["username"] for u in db.users.find({"_id": {"$in": user_ids}}, {"username": 1})}

    result = []
    for doc in docs:
        result.append({
            "id": str(doc["_id"]),
            "filename": doc.get("filename", ""),
            "ats_score": doc.get("ats_score"),
            "uploaded_at": doc["uploaded_at"].isoformat() if doc.get("uploaded_at") else "",
            "username": users_map.get(doc.get("user_id", ""), "Unknown"),
            "predicted_jobs": doc.get("predicted_jobs", []),
        })
    return result
