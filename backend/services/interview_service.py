
import json
from typing import List

from services.groq_client import MODEL, extract_json, async_chat_completion

_SYSTEM_PROMPT = """You are an expert interview coach and hiring manager simulator.
Given a candidate's resume and (optionally) a job description, generate realistic interview questions
that the candidate is likely to face, along with strong suggested answers.

Rules:
1. Include a mix of question types: behavioral, technical, situational, and role-specific.
2. Tailor questions to the candidate's ACTUAL experience — reference specific projects, technologies, or roles from their resume.
3. Suggested answers should use the STAR method (Situation, Task, Action, Result) where appropriate.
4. Answers should ONLY reference information from the provided resume — NEVER fabricate credentials or experience.
5. Include difficulty levels: easy, medium, hard.
6. If a job description is provided, focus questions on the skills and requirements mentioned.

Return ONLY a valid JSON object with this structure:
{
  "questions": [
    {
      "question": "...",
      "category": "behavioral" | "technical" | "situational" | "role-specific" | "general",
      "difficulty": "easy" | "medium" | "hard",
      "why_asked": "Brief explanation of what the interviewer is assessing",
      "suggested_answer": "A strong, detailed answer the candidate could give",
      "tips": "Quick coaching tip for answering this type of question"
    }
  ]
}

Generate exactly the number of questions requested. No markdown fences, no explanation — only the JSON object."""


def _build_prompt(
    resume_data: dict,
    job_description: str,
    target_role: str,
    company_name: str,
    num_questions: int,
    focus: str,
) -> str:
    resume_json = json.dumps(resume_data, indent=2, default=str)
    return f"""Generate {num_questions} interview questions with suggested answers.

=== RESUME DATA ===
{resume_json}

=== TARGET ROLE ===
{target_role or "Not specified"}

=== COMPANY ===
{company_name or "Not specified"}

=== JOB DESCRIPTION ===
{job_description or "Not provided"}

=== FOCUS AREA ===
{focus or "balanced mix of all categories"}

Return a JSON object: {{ "questions": [ ... ] }}
Each question object must have: question, category, difficulty, why_asked, suggested_answer, tips."""


async def generate_interview_questions(
    resume_data: dict,
    job_description: str = "",
    target_role: str = "",
    company_name: str = "",
    num_questions: int = 8,
    focus: str = "balanced",
) -> List[dict]:
    """Generate interview questions and answers using Groq AI. Returns list of Q&A objects."""
    raw = await async_chat_completion(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(
                resume_data, job_description, target_role, company_name, num_questions, focus,
            )},
        ],
        temperature=0.7,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )

    data = extract_json(raw)
    return data.get("questions", [])
