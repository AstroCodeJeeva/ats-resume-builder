"""
ATS Resume Builder — Cover Letter Generation Service
=====================================================
Uses Groq (Llama 3.3 70B) to generate tailored cover letters.
"""

import json
import os
import re

from groq import Groq

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in environment variables.")
        _client = Groq(api_key=api_key)
    return _client


MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_SYSTEM_PROMPT = """You are an expert career coach specialising in cover letters.
Write compelling, ATS-friendly cover letters that:
1. Open with an engaging hook that references the company or role.
2. Highlight 2-3 key achievements from the resume that match the job.
3. Show enthusiasm for the specific company and role.
4. Close with a confident call to action.
5. Stay under 350 words.
6. NEVER fabricate experience or credentials — only use information from the provided resume.

Return ONLY a JSON object with a single key "cover_letter" containing the text (use \\n for newlines).
No markdown fences. No explanation."""


def _build_prompt(
    resume_data: dict,
    job_description: str,
    target_role: str,
    company_name: str,
    tone: str,
) -> str:
    resume_json = json.dumps(resume_data, indent=2, default=str)
    return f"""Generate a cover letter with a "{tone}" tone.

=== RESUME DATA ===
{resume_json}

=== TARGET ROLE ===
{target_role or "Not specified"}

=== COMPANY ===
{company_name or "Not specified"}

=== JOB DESCRIPTION ===
{job_description or "Not provided"}

Return a JSON object: {{ "cover_letter": "..." }}
The cover letter should be 250-350 words, well-structured with paragraphs separated by \\n\\n."""


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


async def generate_cover_letter(
    resume_data: dict,
    job_description: str = "",
    target_role: str = "",
    company_name: str = "",
    tone: str = "professional",
) -> str:
    """Generate a cover letter using Groq AI. Returns the letter text."""
    client = _get_client()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(
                resume_data, job_description, target_role, company_name, tone,
            )},
        ],
        temperature=0.7,
        max_tokens=2048,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    data = _extract_json(raw)
    return data.get("cover_letter", "")
