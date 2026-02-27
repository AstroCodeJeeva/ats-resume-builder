"""
ATS Resume Builder — MongoDB Document Helpers
===============================================
Helper functions for serialising MongoDB documents.
Collections: users, saved_resumes
"""

from datetime import datetime
from bson import ObjectId


def user_doc(username: str, email: str, hashed_password: str, is_admin: bool = False) -> dict:
    """Create a new user document."""
    return {
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "is_admin": is_admin,
        "created_at": datetime.utcnow(),
    }


def user_response(doc: dict) -> dict:
    """Serialise a MongoDB user document for API response."""
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "email": doc["email"],
        "is_admin": doc.get("is_admin", False),
        "created_at": doc.get("created_at", "").isoformat() if doc.get("created_at") else "",
    }


def resume_doc(
    user_id: str,
    title: str,
    resume_data: dict,
    optimized_data: dict | None = None,
    professional_summary: str = "",
    ats_score: int | None = None,
    template: str = "classic",
    target_role: str = "",
    is_optimized: bool = False,
) -> dict:
    """Create a new saved resume document."""
    now = datetime.utcnow()
    return {
        "user_id": user_id,
        "title": title,
        "resume_data": resume_data,
        "optimized_data": optimized_data,
        "professional_summary": professional_summary,
        "ats_score": ats_score,
        "template": template,
        "target_role": target_role,
        "is_optimized": is_optimized,
        "created_at": now,
        "updated_at": now,
    }


def resume_summary(doc: dict) -> dict:
    """Serialise a resume doc for list view (no full data)."""
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", "Untitled"),
        "ats_score": doc.get("ats_score"),
        "template": doc.get("template", "classic"),
        "target_role": doc.get("target_role", ""),
        "is_optimized": doc.get("is_optimized", False),
        "share_token": doc.get("share_token", None),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else "",
        "updated_at": doc["updated_at"].isoformat() if doc.get("updated_at") else "",
    }


def resume_detail(doc: dict) -> dict:
    """Serialise a resume doc with full data."""
    return {
        **resume_summary(doc),
        "resume_data": doc.get("resume_data", {}),
        "optimized_data": doc.get("optimized_data"),
        "professional_summary": doc.get("professional_summary", ""),
    }
