"""
ATS Resume Builder — Pydantic Models / Schemas
===============================================
Shared data shapes used by routers, services, and templates.
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Sub-models ───────────────────────────────────────────────────────

class PersonalInfo(BaseModel):
    name: str = Field(..., example="Jane Doe")
    email: str = Field(..., example="jane@example.com")
    phone: str = Field("", example="+1-555-0100")
    location: str = Field("", example="San Francisco, CA")
    linkedin: str = Field("", example="https://linkedin.com/in/janedoe")
    github: str = Field("", example="https://github.com/janedoe")


class WorkExperience(BaseModel):
    role: str = Field(..., example="Software Engineer")
    company: str = Field(..., example="Google")
    duration: str = Field(..., example="Jan 2021 – Present")
    bullets: List[str] = Field(default_factory=list)


class Project(BaseModel):
    title: str = Field(..., example="E-Commerce Platform")
    description: str = Field("", example="Built a full-stack e-commerce app...")
    technologies: List[str] = Field(default_factory=list)


class Education(BaseModel):
    degree: str = Field(..., example="B.S. Computer Science")
    institution: str = Field(..., example="MIT")
    year: str = Field("", example="2020")


class Certification(BaseModel):
    title: str = Field(..., example="AWS Solutions Architect")
    issuer: str = Field("", example="Amazon Web Services")
    year: str = Field("", example="2022")


# ── Main request / response models ──────────────────────────────────

class ResumeInput(BaseModel):
    """Payload sent from the frontend multi-step form."""
    personal_info: PersonalInfo
    skills: List[str] = Field(default_factory=list)
    work_experience: List[WorkExperience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    target_role: str = Field("", example="Senior Backend Engineer")
    job_description: str = Field("", example="We are looking for a senior backend engineer...")


class ATSScore(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    keyword_match: int = Field(..., ge=0, le=100)
    skills_alignment: int = Field(..., ge=0, le=100)
    experience_relevance: int = Field(..., ge=0, le=100)
    formatting_compliance: int = Field(..., ge=0, le=100)


class Suggestion(BaseModel):
    category: str  # e.g. "Missing Keywords", "Weak Action Verbs"
    message: str
    severity: str = "info"  # info | warning | critical


class ResumeOutput(BaseModel):
    """Full response returned after AI processing."""
    optimized_resume: ResumeInput
    original_resume: ResumeInput
    ats_score: ATSScore
    suggestions: List[Suggestion] = Field(default_factory=list)
    professional_summary: str = ""


class PDFRequest(BaseModel):
    """Request body for PDF generation."""
    resume: ResumeInput
    professional_summary: str = ""
    template: str = Field("classic", example="classic")


class PDFATSCheckItem(BaseModel):
    """Individual ATS compliance check result."""
    check: str          # e.g. "No Tables"
    passed: bool
    detail: str = ""
    severity: str = "info"  # info | warning | critical


class PDFATSCheckResult(BaseModel):
    """Full PDF ATS compliance report."""
    overall_pass: bool
    score: int = Field(..., ge=0, le=100)
    checks: List[PDFATSCheckItem] = Field(default_factory=list)
    summary: str = ""
