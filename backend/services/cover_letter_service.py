
import json

from services.groq_client import MODEL, extract_json, async_chat_completion

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


async def generate_cover_letter(
    resume_data: dict,
    job_description: str = "",
    target_role: str = "",
    company_name: str = "",
    tone: str = "professional",
) -> str:
    """Generate a cover letter using Groq AI. Returns the letter text."""
    raw = await async_chat_completion(
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

    data = extract_json(raw)
    return data.get("cover_letter", "")
