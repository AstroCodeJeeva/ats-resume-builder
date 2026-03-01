
import uuid
from typing import Optional
from datetime import datetime, timezone

from bson import ObjectId
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_sync_db
from db_models import resume_doc, resume_summary, resume_detail
from services.auth_service import get_current_user

router = APIRouter()


class SaveResumeRequest(BaseModel):
    id: Optional[str] = None  # MongoDB ObjectId string; if provided, update existing
    title: str = Field("Untitled Resume", max_length=200)
    resume_data: dict
    optimized_data: Optional[dict] = None
    professional_summary: str = ""
    ats_score: Optional[int] = None
    template: str = "classic"
    target_role: str = ""
    is_optimized: bool = False


@router.post("/save")
def save_resume(
    body: SaveResumeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save or update a resume."""
    db = get_sync_db()
    user_id = str(current_user["_id"])

    fields = {
        "title": body.title,
        "resume_data": body.resume_data,
        "optimized_data": body.optimized_data,
        "professional_summary": body.professional_summary,
        "ats_score": body.ats_score,
        "template": body.template,
        "target_role": body.target_role,
        "is_optimized": body.is_optimized,
    }

    if body.id:
        # Update existing
        try:
            oid = ObjectId(body.id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid resume id")

        existing = db.saved_resumes.find_one({"_id": oid, "user_id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Resume not found")

        fields["updated_at"] = datetime.now(timezone.utc)
        db.saved_resumes.update_one({"_id": oid}, {"$set": fields})
        return {"id": body.id, "title": body.title, "message": "Resume updated successfully"}
    else:
        # Create new
        doc = resume_doc(user_id=user_id, **fields)
        result = db.saved_resumes.insert_one(doc)
        return {
            "id": str(result.inserted_id),
            "title": body.title,
            "message": "Resume saved successfully",
        }


@router.get("/list")
def list_resumes(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List saved resumes for the current user (newest first, paginated)."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    cursor = (
        db.saved_resumes
        .find({"user_id": user_id})
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [resume_summary(r) for r in cursor]


@router.get("/{resume_id}")
def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single saved resume with full data."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    try:
        oid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume id")

    doc = db.saved_resumes.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume_detail(doc)


@router.put("/{resume_id}")
def update_resume(
    resume_id: str,
    body: SaveResumeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing saved resume."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    try:
        oid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume id")

    existing = db.saved_resumes.find_one({"_id": oid, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.saved_resumes.update_one(
        {"_id": oid},
        {"$set": {
            "title": body.title,
            "resume_data": body.resume_data,
            "optimized_data": body.optimized_data,
            "professional_summary": body.professional_summary,
            "ats_score": body.ats_score,
            "template": body.template,
            "target_role": body.target_role,
            "is_optimized": body.is_optimized,
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    return {"id": resume_id, "title": body.title, "message": "Resume updated"}


@router.delete("/{resume_id}")
def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a saved resume."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    try:
        oid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume id")

    result = db.saved_resumes.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/share")
def share_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """Generate a unique share token for a resume, making it publicly viewable."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    try:
        oid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume id")

    doc = db.saved_resumes.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    # If already shared, return existing token
    if doc.get("share_token"):
        return {"share_token": doc["share_token"]}

    token = uuid.uuid4().hex  # Full 32 hex chars (128 bits of entropy)
    db.saved_resumes.update_one({"_id": oid}, {"$set": {"share_token": token}})
    return {"share_token": token}


@router.delete("/{resume_id}/share")
def unshare_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    """Revoke the public share link for a resume."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    try:
        oid = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume id")

    doc = db.saved_resumes.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.saved_resumes.update_one({"_id": oid}, {"$unset": {"share_token": ""}})
    return {"message": "Share link revoked"}


@router.get("/public/{share_token}")
def get_shared_resume(share_token: str):
    """View a publicly shared resume by its token. No authentication required."""
    db = get_sync_db()
    doc = db.saved_resumes.find_one({"share_token": share_token})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared resume not found or link has been revoked")

    # Return limited data — no user_id, no internal fields
    resume_data = doc.get("optimized_data") or doc.get("resume_data", {})
    return {
        "title": doc.get("title", "Untitled"),
        "resume_data": resume_data,
        "professional_summary": doc.get("professional_summary", ""),
        "ats_score": doc.get("ats_score"),
        "template": doc.get("template", "classic"),
        "target_role": doc.get("target_role", ""),
    }
