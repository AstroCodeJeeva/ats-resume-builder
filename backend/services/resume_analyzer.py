"""
ATS Resume Builder — AI Resume Analyzer & Job Predictor
=========================================================
Uses Groq (Llama 3.3 70B) to:
  1. Analyze uploaded resume text → score, strengths, weaknesses, suggestions
  2. Predict matching job titles/roles based on resume content
"""

import json
import os
import re
from typing import List

from groq import Groq

# ── Client ───────────────────────────────────────────────────────────
_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _client = Groq(api_key=api_key)
    return _client


MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _extract_json(text: str) -> dict:
    """Extract JSON from response, stripping markdown fences if present."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


# ── Resume Analysis ──────────────────────────────────────────────────

_ANALYZE_SYSTEM = """You are an expert ATS (Applicant Tracking System) resume analyst.
Analyze the given resume text and provide a detailed ATS compatibility assessment.
Always respond with VALID JSON only. No markdown fences, no explanation."""


async def analyze_resume_text(resume_text: str, job_description: str = "") -> dict:
    """
    Analyze resume text with AI and return structured analysis.
    Returns dict with: ats_score, section_scores, strengths, weaknesses, suggestions, keyword_analysis
    """
    client = _get_client()

    jd_context = f"\n\n=== TARGET JOB DESCRIPTION ===\n{job_description}" if job_description else ""

    user_prompt = f"""Analyze this resume for ATS compatibility and provide a detailed assessment.

=== RESUME TEXT ===
{resume_text[:6000]}
{jd_context}

Return a JSON object with EXACTLY these keys:
{{
  "ats_score": <integer 0-100, overall ATS compatibility score>,
  "section_scores": {{
    "contact_info": <0-100>,
    "professional_summary": <0-100>,
    "work_experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "formatting": <0-100>
  }},
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "suggestions": [
    {{
      "category": "Keywords" | "Experience" | "Skills" | "Formatting" | "Summary" | "Education",
      "message": "Actionable suggestion text",
      "severity": "info" | "warning" | "critical",
      "impact": "high" | "medium" | "low"
    }}
  ],
  "keyword_analysis": {{
    "top_keywords_found": ["keyword1", "keyword2", ...],
    "missing_important_keywords": ["keyword1", "keyword2", ...],
    "keyword_density_score": <0-100>
  }}
}}

Be thorough but fair. Provide at least 3 strengths, 3 weaknesses, and 5 suggestions.
Return ONLY the JSON object."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _ANALYZE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


# ── Job Prediction ───────────────────────────────────────────────────

_PREDICT_SYSTEM = """You are an expert career advisor and job market analyst.
Based on a candidate's resume, predict the most suitable job roles they should apply for.
Always respond with VALID JSON only. No markdown fences, no explanation."""


async def predict_jobs_from_text(resume_text: str) -> List[dict]:
    """
    Predict matching job titles based on resume content.
    Returns list of dicts with: title, match_score, reason, salary_range, demand_level
    """
    client = _get_client()

    user_prompt = f"""Based on this resume, predict the top 8 most suitable job roles.

=== RESUME TEXT ===
{resume_text[:5000]}

Return a JSON object with key "jobs" containing an array:
{{
  "jobs": [
    {{
      "title": "Job Title",
      "match_score": <integer 1-100, how well the candidate matches>,
      "reason": "Brief reason why this role is a good match",
      "salary_range": "$XX,000 - $XXX,000",
      "demand_level": "High" | "Medium" | "Low",
      "skills_matched": ["skill1", "skill2", "skill3"],
      "skills_to_develop": ["skill1", "skill2"]
    }}
  ]
}}

Consider the candidate's:
- Technical skills and tools
- Work experience level and domain
- Education background
- Project experience
- Certifications

Rank jobs by match_score (highest first). Use realistic 2025 salary ranges (USD).
Return ONLY the JSON object."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _PREDICT_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.6,
        max_tokens=2500,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    data = _extract_json(raw)
    jobs = data.get("jobs", [])

    # Sort by match_score descending
    jobs.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return jobs[:8]
