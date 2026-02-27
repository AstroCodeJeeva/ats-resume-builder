"""
ATS Resume Builder — Interview Prep Router
============================================
POST /api/interview/generate  →  AI-generated interview questions + answers
"""

from typing import List
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from services.interview_service import generate_interview_questions
from rate_limiter import limiter

router = APIRouter()


class InterviewPrepRequest(BaseModel):
    resume_data: dict
    job_description: str = Field("", max_length=5000)
    target_role: str = Field("", max_length=200)
    company_name: str = Field("", max_length=200)
    num_questions: int = Field(8, ge=3, le=15)
    focus: str = Field("balanced", pattern="^(balanced|behavioral|technical|situational)$")


class InterviewQuestion(BaseModel):
    question: str
    category: str
    difficulty: str
    why_asked: str
    suggested_answer: str
    tips: str


class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestion]
    total: int


@router.post("/generate", response_model=InterviewPrepResponse)
@limiter.limit("10/minute")
async def generate(request: Request, body: InterviewPrepRequest):
    """Generate AI-powered interview questions and suggested answers."""
    try:
        questions = await generate_interview_questions(
            resume_data=body.resume_data,
            job_description=body.job_description,
            target_role=body.target_role,
            company_name=body.company_name,
            num_questions=body.num_questions,
            focus=body.focus,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    # Validate and sanitize each question
    validated = []
    for q in questions:
        try:
            validated.append(InterviewQuestion(
                question=q.get("question", ""),
                category=q.get("category", "general"),
                difficulty=q.get("difficulty", "medium"),
                why_asked=q.get("why_asked", ""),
                suggested_answer=q.get("suggested_answer", ""),
                tips=q.get("tips", ""),
            ))
        except Exception:
            continue

    return InterviewPrepResponse(questions=validated, total=len(validated))
