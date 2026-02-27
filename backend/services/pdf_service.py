"""
ATS Resume Builder — PDF Generation Service
=============================================
Renders a Jinja2 HTML template and converts it to PDF via xhtml2pdf.
"""

import os
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

from models import ResumeInput

# ── Template setup ───────────────────────────────────────────────────
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

# Map of template key → template file name
TEMPLATE_MAP = {
    "classic": "classic.html",
    "modern": "modern.html",
    "fresher": "fresher.html",
    "technical": "technical.html",
}


def render_resume_html(
    resume: ResumeInput,
    professional_summary: str = "",
    template_key: str = "classic",
) -> str:
    """Render resume data into an HTML string using the chosen template."""
    tpl_file = TEMPLATE_MAP.get(template_key, "classic.html")
    template = _env.get_template(tpl_file)
    return template.render(
        resume=resume,
        summary=professional_summary,
    )


def generate_pdf_bytes(
    resume: ResumeInput,
    professional_summary: str = "",
    template_key: str = "classic",
) -> bytes:
    """Generate a PDF from the resume data and return raw bytes."""
    html_str = render_resume_html(resume, professional_summary, template_key)
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_str, dest=pdf_buffer)
    if pisa_status.err:
        raise RuntimeError(f"PDF generation failed with {pisa_status.err} errors")
    return pdf_buffer.getvalue()
