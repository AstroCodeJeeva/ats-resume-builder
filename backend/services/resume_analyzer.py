
from typing import List

from services.groq_client import MODEL, extract_json, async_chat_completion


_ANALYZE_SYSTEM = """You are an expert ATS (Applicant Tracking System) resume analyst.
Analyze the given resume text and provide a detailed ATS compatibility assessment.
Always respond with VALID JSON only. No markdown fences, no explanation."""


async def analyze_resume_text(resume_text: str, job_description: str = "") -> dict:
    """
    Analyze resume text with AI and return structured analysis.
    Returns dict with: ats_score, section_scores, strengths, weaknesses, suggestions, keyword_analysis
    """
    jd_context = f"\n\n=== TARGET JOB DESCRIPTION ===\n{job_description}" if job_description else ""

    user_prompt = f"""Analyze this resume for ATS compatibility and provide a detailed assessment.

=== RESUME TEXT ===
{resume_text[:6000]}
{jd_context}

Return a JSON object with EXACTLY these keys:
{{
  "ats_score": <integer 0-100, overall ATS compatibility score>,
  "section_scores": {{
    "contact_info": <0-100, score 0 if no email/phone found>,
    "professional_summary": <0-100, score 0 if no summary/objective section>,
    "work_experience": <0-100, MUST be 0 if there is NO work experience section at all>,
    "skills": <0-100, score 0 if no skills listed>,
    "education": <0-100, score 0 if no education section>,
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
CRITICAL SCORING RULES:
- If a section is completely MISSING from the resume, its score MUST be 0.
- If there is NO work experience section, work_experience MUST be 0.
- The overall ats_score MUST reflect missing sections — a resume without work experience should NOT score above 60.
- A resume missing 2+ major sections (experience, skills, education) should NOT score above 40.
Return ONLY the JSON object."""

    raw = await async_chat_completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": _ANALYZE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    data = extract_json(raw)

    # ── Recalculate overall ATS score from section_scores ──
    # AI often inflates the overall score even when critical sections are
    # missing (e.g., work_experience = 0 but overall = 85).  We recompute
    # from the individual section scores with proper weighting so the
    # overall accurately reflects missing/weak sections.
    section = data.get("section_scores", {})
    if section:
        weights = {
            "contact_info": 0.10,
            "professional_summary": 0.10,
            "work_experience": 0.30,   # most important for ATS
            "skills": 0.20,
            "education": 0.10,
            "formatting": 0.10,
        }
        # Any section score the AI provided but is missing from our weight
        # map gets a small default weight; unrecognised keys are kept.
        used_weight = 0.0
        weighted_sum = 0.0
        for key, score in section.items():
            w = weights.get(key, 0.05)
            # Clamp individual scores to 0-100
            score = max(0, min(100, int(score) if isinstance(score, (int, float)) else 0))
            section[key] = score
            weighted_sum += score * w
            used_weight += w
        if used_weight > 0:
            data["ats_score"] = max(0, min(100, int(weighted_sum / used_weight * 1.0)))
        # Ensure remaining weight from missing sections counts as 0
        # (e.g., if AI omits a section entirely, it hurts the score)
        total_expected_weight = sum(weights.values())  # 0.90
        if used_weight < total_expected_weight:
            penalty = (total_expected_weight - used_weight) / total_expected_weight
            data["ats_score"] = max(0, int(data["ats_score"] * (1 - penalty)))

    return data


_PREDICT_SYSTEM = """You are an expert career advisor and job market analyst.
Based on a candidate's resume, predict the most suitable job roles they should apply for.
Always respond with VALID JSON only. No markdown fences, no explanation."""


async def predict_jobs_from_text(resume_text: str) -> List[dict]:
    """
    Predict matching job titles based on resume content.
    Returns list of dicts with: title, match_score, reason, salary_range, demand_level
    """
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

    raw = await async_chat_completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": _PREDICT_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.6,
        max_tokens=2500,
        response_format={"type": "json_object"},
    )

    data = extract_json(raw)
    jobs = data.get("jobs", [])

    # Sort by match_score descending
    jobs.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return jobs[:8]
