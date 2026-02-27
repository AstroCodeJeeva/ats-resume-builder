"""
ATS Resume Builder — Cover Letter Router
==========================================
POST /api/cover-letter/generate  →  AI-generated cover letter from resume + job description
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from services.cover_letter_service import generate_cover_letter
from rate_limiter import limiter

router = APIRouter()


class CoverLetterRequest(BaseModel):
    resume_data: dict
    job_description: str = Field("", min_length=0, max_length=5000)
    target_role: str = Field("", max_length=200)
    company_name: str = Field("", max_length=200)
    tone: str = Field("professional", pattern="^(professional|enthusiastic|concise)$")


class CoverLetterResponse(BaseModel):
    cover_letter: str
    word_count: int


@router.post("/generate", response_model=CoverLetterResponse)
@limiter.limit("10/minute")
async def generate(request: Request, body: CoverLetterRequest):
    """Generate an AI-powered cover letter from resume data and optional job description."""
    try:
        letter = await generate_cover_letter(
            resume_data=body.resume_data,
            job_description=body.job_description,
            target_role=body.target_role,
            company_name=body.company_name,
            tone=body.tone,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    word_count = len(letter.split())
    return CoverLetterResponse(cover_letter=letter, word_count=word_count)
