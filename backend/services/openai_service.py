
from typing import Tuple, List

from models import ResumeInput, Suggestion
from services.groq_client import MODEL, extract_json, async_chat_completion


_SYSTEM_PROMPT = """You are an expert career coach and ATS resume optimiser.
Your goals:
1. Rewrite weak bullet points using strong action verbs and quantifiable achievements.
2. Add missing keywords from the job description.
3. Improve formatting for ATS scanners (no tables, no graphics, clean text).
4. Generate a concise, impactful professional summary.
5. Keep the resume truthful — do not fabricate experience or credentials.

Always respond with VALID JSON matching the schema provided. No markdown fences, no explanation — only the JSON object."""


def _build_user_prompt(resume: ResumeInput) -> str:
    resume_json = resume.model_dump_json(indent=2)
    return f"""Below is a candidate's resume in JSON format and (optionally) a target job description.

=== RESUME JSON ===
{resume_json}

=== TARGET ROLE ===
{resume.target_role or "Not specified"}

=== JOB DESCRIPTION ===
{resume.job_description or "Not provided"}

Please return a JSON object with exactly these keys:
{{
  "optimized_resume": {{ ... same schema as the input resume JSON, with improved bullet points, added keywords, and stronger action verbs ... }},
  "professional_summary": "A 2-3 sentence professional summary tailored to the target role.",
  "suggestions": [
    {{
      "category": "Missing Keywords" | "Weak Action Verbs" | "Bullet Point Improvement" | "Formatting Warning" | "Summary Tip",
      "message": "Actionable suggestion text",
      "severity": "info" | "warning" | "critical"
    }}
  ]
}}

Rules:
- Improve ALL bullet points with metrics where plausible (e.g., "Improved API response time by 40%").
- Identify at least 3-5 missing keywords if a job description is provided.
- Flag weak verbs like "helped", "worked on", "responsible for".
- Do NOT change company names, dates, or degrees.
- Return ONLY the JSON. No markdown fences, no explanation."""


async def generate_optimized_resume(
    resume: ResumeInput,
) -> Tuple[ResumeInput, str, List[Suggestion]]:
    """
    Sends the resume to Groq (Llama 3.3 70B) and returns:
      (optimized_resume, professional_summary, suggestions)
    """
    raw = await async_chat_completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(resume)},
        ],
        temperature=0.7,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )

    data = extract_json(raw)

    optimized = ResumeInput.model_validate(data.get("optimized_resume", resume.model_dump()))
    summary = data.get("professional_summary", "")
    raw_suggestions = data.get("suggestions", [])
    suggestions = [Suggestion(**s) for s in raw_suggestions]

    return optimized, summary, suggestions
