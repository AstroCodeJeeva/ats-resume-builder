
import re
from typing import List, Set

from models import ResumeInput, ATSScore


def _tokenize(text: str) -> Set[str]:
    """Lowercase tokenisation — removes non-alpha chars."""
    return set(re.findall(r"[a-z]{2,}", text.lower()))


def _extract_resume_text(resume: ResumeInput) -> str:
    """Flatten the resume into a single plain-text blob for keyword matching."""
    parts: List[str] = []
    parts.append(resume.personal_info.name)
    parts.extend(resume.skills)
    for exp in resume.work_experience:
        parts.append(exp.role)
        parts.append(exp.company)
        parts.extend(exp.bullets)
    for proj in resume.projects:
        parts.append(proj.title)
        parts.append(proj.description)
        parts.extend(proj.technologies)
    for edu in resume.education:
        parts.append(edu.degree)
        parts.append(edu.institution)
    for cert in resume.certifications:
        parts.append(cert.title)
        parts.append(cert.issuer)
    parts.append(resume.target_role)
    return " ".join(parts)


def _keyword_match_score(resume_tokens: Set[str], jd_tokens: Set[str]) -> int:
    """Percentage of job-description keywords found in the resume."""
    if not jd_tokens:
        # No JD provided → base score on resume token richness
        if len(resume_tokens) >= 80:
            return 40
        elif len(resume_tokens) >= 40:
            return 25
        return 10  # Very sparse resume
    matched = resume_tokens & jd_tokens
    return min(100, int((len(matched) / len(jd_tokens)) * 100))


def _skills_alignment_score(skills: List[str], jd_tokens: Set[str]) -> int:
    """How many listed skills appear in the JD tokens."""
    skill_tokens = set()
    for s in skills:
        skill_tokens.update(_tokenize(s))
    if not skill_tokens:
        return 0  # No skills entered → 0%
    if not jd_tokens:
        # No JD provided → base score on number of skills listed
        count = len(skills)
        if count >= 8:
            return 40
        elif count >= 5:
            return 30
        elif count >= 3:
            return 20
        return 10
    matched = skill_tokens & jd_tokens
    return min(100, int((len(matched) / len(skill_tokens)) * 100))


def _experience_relevance_score(resume: ResumeInput, jd_tokens: Set[str]) -> int:
    """Rough relevance of work bullets to the JD."""
    # No work experience at all → score is 0
    if not resume.work_experience:
        return 0
    bullet_text = " ".join(
        b for exp in resume.work_experience for b in exp.bullets
    )
    bullet_tokens = _tokenize(bullet_text)
    if not bullet_tokens:
        # Has experience entries but no bullet points → very low
        return 5
    if not jd_tokens:
        # No JD provided → base score on bullet richness
        if len(bullet_tokens) >= 60:
            return 40
        elif len(bullet_tokens) >= 30:
            return 25
        return 15
    matched = bullet_tokens & jd_tokens
    return min(100, int((len(matched) / max(len(jd_tokens), 1)) * 120))


def _formatting_compliance_score(resume: ResumeInput) -> int:
    """
    Simple heuristic checks:
      - Has contact info → +20
      - Has skills → +20
      - Has work experience → +20
      - Bullets start with action verbs → +20
      - Resume not too short → +20
    """
    score = 0
    pi = resume.personal_info
    if pi.email and pi.phone:
        score += 20
    if len(resume.skills) >= 3:
        score += 20
    if len(resume.work_experience) >= 1:
        score += 20

    # Check for action verbs at bullet start
    action_verbs = {
        "achieved", "built", "created", "delivered", "developed", "designed",
        "engineered", "established", "executed", "generated", "implemented",
        "improved", "increased", "launched", "led", "managed", "optimized",
        "reduced", "spearheaded", "streamlined", "architected", "automated",
        "coordinated", "deployed", "enhanced", "integrated", "mentored",
        "migrated", "orchestrated", "pioneered", "refactored", "resolved",
        "scaled", "secured", "transformed",
    }
    total_bullets = 0
    action_bullets = 0
    for exp in resume.work_experience:
        for b in exp.bullets:
            if not b or not b.strip():
                continue
            total_bullets += 1
            words = b.strip().split()
            first_lower = words[0].lower()
            first_stem = first_lower.rstrip("ed").rstrip("s")
            if first_stem in action_verbs or first_lower in action_verbs:
                action_bullets += 1
    if total_bullets > 0 and (action_bullets / total_bullets) > 0.5:
        score += 20

    # Length check
    text = _extract_resume_text(resume)
    if len(text.split()) > 100:
        score += 20

    return min(100, score)


def compute_ats_score(resume: ResumeInput) -> ATSScore:
    """Compute all ATS sub-scores and the weighted overall score."""
    resume_text = _extract_resume_text(resume)
    resume_tokens = _tokenize(resume_text)
    jd_tokens = _tokenize(resume.job_description) if resume.job_description else set()

    kw = _keyword_match_score(resume_tokens, jd_tokens)
    sa = _skills_alignment_score(resume.skills, jd_tokens)
    er = _experience_relevance_score(resume, jd_tokens)
    fc = _formatting_compliance_score(resume)

    # Weighted average: keywords=30%, skills=25%, experience=25%, formatting=20%
    overall = int(kw * 0.30 + sa * 0.25 + er * 0.25 + fc * 0.20)
    overall = max(0, min(100, overall))

    return ATSScore(
        overall=overall,
        keyword_match=kw,
        skills_alignment=sa,
        experience_relevance=er,
        formatting_compliance=fc,
    )
