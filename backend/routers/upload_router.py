
import os
import re
import json
import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from pydantic import BaseModel

from database import get_sync_db
from services.auth_service import get_current_user, get_optional_user
from services.resume_parser import extract_text_from_file
from services.resume_analyzer import analyze_resume_text, predict_jobs_from_text
from rate_limiter import limiter

router = APIRouter()


class AnalysisResult(BaseModel):
    ats_score: int
    keyword_density: dict
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[dict]
    section_scores: dict
    word_count: int
    predicted_jobs: List[dict]


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_uploaded_resume(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(""),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """
    Upload a PDF or DOCX resume file. Returns:
    - ATS score breakdown
    - Strengths & weaknesses
    - Suggestions for improvement
    - Section-by-section analysis
    - Predicted matching jobs
    """
    # Validate file type
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    allowed_extensions = {".pdf", ".docx", ".doc"}

    filename = file.filename or "resume"
    ext = os.path.splitext(filename)[1].lower()

    if file.content_type not in allowed_types and ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported. Please upload a .pdf or .docx file.",
        )

    # Read file contents
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    # Extract text
    try:
        resume_text = extract_text_from_file(contents, ext)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not extract text from file: {exc}")

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough text from the file. Please ensure it's a valid resume.",
        )

    # Analyze with AI
    try:
        analysis = await analyze_resume_text(resume_text, job_description)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}")

    # Predict matching jobs
    try:
        predicted_jobs = await predict_jobs_from_text(resume_text)
    except Exception:
        predicted_jobs = []

    # Save to database if user is logged in
    upload_id = None
    if current_user:
        def _save_upload():
            db = get_sync_db()
            doc = {
                "user_id": str(current_user["_id"]),
                "filename": filename,
                "resume_text": resume_text[:10000],  # Store first 10k chars
                "job_description": job_description[:5000],
                "ats_score": analysis.get("ats_score", 0),
                "analysis": analysis,
                "predicted_jobs": predicted_jobs,
                "uploaded_at": datetime.now(timezone.utc),
            }
            result = db.resume_uploads.insert_one(doc)
            return str(result.inserted_id)
        upload_id = await asyncio.to_thread(_save_upload)

    return {
        "id": upload_id,
        "filename": filename,
        "word_count": len(resume_text.split()),
        "ats_score": analysis.get("ats_score", 0),
        "section_scores": analysis.get("section_scores", {}),
        "strengths": analysis.get("strengths", []),
        "weaknesses": analysis.get("weaknesses", []),
        "suggestions": analysis.get("suggestions", []),
        "keyword_analysis": analysis.get("keyword_analysis", {}),
        "predicted_jobs": predicted_jobs,
        "resume_preview": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
    }


@router.post("/quick-score")
@limiter.limit("20/minute")
async def quick_score_resume(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(""),
):
    """Quick ATS score without AI — uses heuristic analysis only."""
    filename = file.filename or "resume"
    ext = os.path.splitext(filename)[1].lower()

    contents = await file.read()
    try:
        resume_text = extract_text_from_file(contents, ext)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not extract text: {exc}")

    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract enough text from the file.")

    # Heuristic scoring
    score_result = _heuristic_score(resume_text, job_description)
    return score_result


@router.get("/history")
def upload_history(current_user: dict = Depends(get_current_user)):
    """Get the current user's resume upload history."""
    db = get_sync_db()
    user_id = str(current_user["_id"])
    cursor = (
        db.resume_uploads
        .find({"user_id": user_id})
        .sort("uploaded_at", -1)
        .limit(20)
    )
    results = []
    for doc in cursor:
        results.append({
            "id": str(doc["_id"]),
            "filename": doc.get("filename", ""),
            "ats_score": doc.get("ats_score", 0),
            "uploaded_at": doc["uploaded_at"].isoformat() if doc.get("uploaded_at") else "",
            "predicted_jobs": doc.get("predicted_jobs", [])[:3],
        })
    return results


@router.get("/{upload_id}")
def get_upload(upload_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single upload result."""
    db = get_sync_db()
    try:
        oid = ObjectId(upload_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid upload id")

    doc = db.resume_uploads.find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Upload not found")

    analysis = doc.get("analysis", {})
    return {
        "id": str(doc["_id"]),
        "filename": doc.get("filename", ""),
        "ats_score": doc.get("ats_score", 0),
        "section_scores": analysis.get("section_scores", {}),
        "strengths": analysis.get("strengths", []),
        "weaknesses": analysis.get("weaknesses", []),
        "suggestions": analysis.get("suggestions", []),
        "keyword_analysis": analysis.get("keyword_analysis", {}),
        "predicted_jobs": doc.get("predicted_jobs", []),
        "uploaded_at": doc["uploaded_at"].isoformat() if doc.get("uploaded_at") else "",
        "resume_preview": doc.get("resume_text", "")[:500],
    }


@router.delete("/{upload_id}")
def delete_upload(upload_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an upload."""
    db = get_sync_db()
    try:
        oid = ObjectId(upload_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid upload id")

    result = db.resume_uploads.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {"message": "Upload deleted successfully"}


def _heuristic_score(text: str, job_description: str = "") -> dict:
    """Fast heuristic ATS scoring."""
    scores = {}
    text_lower = text.lower()
    words = text_lower.split()
    word_count = len(words)

    # Contact info check (20 pts)
    contact_score = 0
    if re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text):
        contact_score += 7
    if re.search(r'[\+]?[\d\s\-\(\)]{7,}', text):
        contact_score += 7
    if 'linkedin' in text_lower:
        contact_score += 6
    scores["contact_info"] = min(20, contact_score)

    # Experience section (25 pts)
    exp_score = 0
    action_verbs = {"developed", "managed", "led", "built", "designed", "implemented",
                    "created", "improved", "increased", "reduced", "launched", "achieved",
                    "delivered", "engineered", "optimized", "automated", "streamlined"}
    verb_count = sum(1 for w in words if w.rstrip("ed,s.") in action_verbs)
    exp_score += min(10, verb_count * 2)
    if re.search(r'\d+%|\d+\+|increased|decreased|reduced|improved', text_lower):
        exp_score += 8
    if any(kw in text_lower for kw in ["experience", "work history", "employment"]):
        exp_score += 7
    scores["experience"] = min(25, exp_score)

    # Skills section (20 pts)
    skill_score = 0
    if any(kw in text_lower for kw in ["skills", "technologies", "tools", "proficiencies"]):
        skill_score += 10
    tech_keywords = {"python", "javascript", "react", "node", "sql", "aws", "docker",
                     "kubernetes", "java", "typescript", "html", "css", "git", "api",
                     "mongodb", "postgresql", "linux", "agile", "scrum", "machine learning"}
    found_skills = sum(1 for kw in tech_keywords if kw in text_lower)
    skill_score += min(10, found_skills * 2)
    scores["skills"] = min(20, skill_score)

    # Education section (15 pts)
    edu_score = 0
    if any(kw in text_lower for kw in ["education", "degree", "university", "college", "bachelor", "master"]):
        edu_score += 10
    if re.search(r'20\d\d|19\d\d', text):
        edu_score += 5
    scores["education"] = min(15, edu_score)

    # Formatting (20 pts)
    fmt_score = 0
    if 100 < word_count < 1500:
        fmt_score += 8
    elif word_count >= 50:
        fmt_score += 4
    sentences = text.split('.')
    if len(sentences) > 5:
        fmt_score += 6
    if not re.search(r'[|]{2,}|[=]{5,}|[*]{5,}', text):
        fmt_score += 6
    scores["formatting"] = min(20, fmt_score)

    overall = sum(scores.values())

    # Job description keyword match (bonus info)
    jd_match = {}
    if job_description:
        jd_tokens = set(re.findall(r'[a-z]{3,}', job_description.lower()))
        resume_tokens = set(re.findall(r'[a-z]{3,}', text_lower))
        matched = jd_tokens & resume_tokens
        missing = jd_tokens - resume_tokens
        jd_match = {
            "matched_keywords": sorted(list(matched))[:20],
            "missing_keywords": sorted(list(missing))[:20],
            "match_percentage": round(len(matched) / max(len(jd_tokens), 1) * 100, 1),
        }

    return {
        "ats_score": min(100, overall),
        "section_scores": scores,
        "word_count": word_count,
        "jd_match": jd_match,
    }
