
from fastapi import APIRouter, HTTPException, Request

from models import ResumeInput, ResumeOutput, ATSScore
from services.openai_service import generate_optimized_resume
from services.scoring_service import compute_ats_score
from rate_limiter import limiter

router = APIRouter()


@router.post("/optimize", response_model=ResumeOutput)
@limiter.limit("10/minute")
async def optimize_resume(request: Request, payload: ResumeInput):
    """
    Accepts raw resume data, sends it to OpenAI for optimisation,
    computes the ATS score, and returns everything in one response.
    """
    try:
        optimized, summary, suggestions = await generate_optimized_resume(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI API error: {exc}",
        )

    # Score the *optimized* resume (so user sees improved score)
    ats_score: ATSScore = compute_ats_score(optimized)

    return ResumeOutput(
        optimized_resume=optimized,
        original_resume=payload,
        ats_score=ats_score,
        suggestions=suggestions,
        professional_summary=summary,
    )


@router.post("/score", response_model=ATSScore)
async def score_resume(payload: ResumeInput):
    """Return the ATS score for a resume without running AI optimisation."""
    return compute_ats_score(payload)
