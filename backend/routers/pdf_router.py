
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, HTMLResponse

from models import PDFRequest, PDFATSCheckResult, PDFATSCheckItem
from services.pdf_service import generate_pdf_bytes, render_resume_html
from services.docx_service import generate_docx_bytes

router = APIRouter()


def _safe_filename(name: str, ext: str) -> str:
    """Sanitise a user-supplied name for use in Content-Disposition."""
    safe = re.sub(r'[^\w\s-]', '', name).strip().replace(' ', '_') or 'Resume'
    return f"{safe}_Resume{ext}"


@router.post("/generate")
async def generate_pdf(payload: PDFRequest):
    """Generate a PDF from resume data and the chosen template."""
    try:
        pdf_bytes = generate_pdf_bytes(
            resume=payload.resume,
            professional_summary=payload.professional_summary,
            template_key=payload.template,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    filename = _safe_filename(payload.resume.personal_info.name, '.pdf')
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/generate-docx")
async def generate_docx(payload: PDFRequest):
    """Generate a DOCX (Word) document from resume data."""
    try:
        docx_bytes = generate_docx_bytes(
            resume=payload.resume,
            professional_summary=payload.professional_summary,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {exc}")

    filename = _safe_filename(payload.resume.personal_info.name, '.docx')
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/preview", response_class=HTMLResponse)
async def preview_html(payload: PDFRequest):
    """Return rendered HTML for live preview in the browser."""
    try:
        html = render_resume_html(
            resume=payload.resume,
            professional_summary=payload.professional_summary,
            template_key=payload.template,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {exc}")
    return HTMLResponse(content=html)


def _check_no_tables(html: str) -> PDFATSCheckItem:
    tables = re.findall(r"<table[\s>]", html, re.IGNORECASE)
    return PDFATSCheckItem(
        check="No Tables",
        passed=len(tables) == 0,
        detail=f"Found {len(tables)} <table> element(s). ATS parsers struggle with tables."
        if tables else "No tables detected — ATS-safe.",
        severity="critical" if tables else "info",
    )


def _check_no_images(html: str) -> PDFATSCheckItem:
    imgs = re.findall(r"<img[\s>]", html, re.IGNORECASE)
    svgs = re.findall(r"<svg[\s>]", html, re.IGNORECASE)
    count = len(imgs) + len(svgs)
    return PDFATSCheckItem(
        check="No Images / Graphics",
        passed=count == 0,
        detail=f"Found {count} image/SVG element(s). ATS cannot read images."
        if count else "No images or SVGs — ATS-safe.",
        severity="critical" if count else "info",
    )


def _check_no_columns(html: str) -> PDFATSCheckItem:
    """Check for multi-column CSS layouts that confuse ATS."""
    col_patterns = re.findall(
        r"(column-count|columns\s*:|display\s*:\s*flex|display\s*:\s*grid|float\s*:\s*(left|right))",
        html, re.IGNORECASE,
    )
    # columns in skills is acceptable; we flag only grid/float as problematic
    grid_float = [p for p in col_patterns if "grid" in p[0].lower() or "float" in p[0].lower()]
    return PDFATSCheckItem(
        check="No Complex Multi-Column Layout",
        passed=len(grid_float) == 0,
        detail=f"Found {len(grid_float)} complex layout rule(s) (grid/float). These may confuse ATS."
        if grid_float else "No problematic multi-column layouts detected.",
        severity="warning" if grid_float else "info",
    )


def _check_headings(html: str) -> PDFATSCheckItem:
    """ATS parsers rely on heading tags to identify sections."""
    headings = re.findall(r"<h[1-6][\s>]", html, re.IGNORECASE)
    return PDFATSCheckItem(
        check="Uses Heading Tags",
        passed=len(headings) >= 3,
        detail=f"Found {len(headings)} heading tag(s). Headings help ATS identify sections."
        if headings else "No heading tags found. ATS may not identify resume sections.",
        severity="info" if len(headings) >= 3 else "warning",
    )


def _check_readable_text(html: str) -> PDFATSCheckItem:
    """Strip tags and check there's enough parseable text."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    word_count = len(text.split())
    return PDFATSCheckItem(
        check="Sufficient Readable Text",
        passed=word_count >= 80,
        detail=f"{word_count} words of parseable text found."
        + (" This is a bit short." if word_count < 80 else " Good length for ATS parsing."),
        severity="info" if word_count >= 80 else "warning",
    )


def _check_contact_info(html: str) -> PDFATSCheckItem:
    """Check that email and phone are present in the rendered output."""
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", html))
    has_phone = bool(re.search(r"[\+\(]?\d[\d\s\-().]{6,}", html))
    both = has_email and has_phone
    return PDFATSCheckItem(
        check="Contact Info Visible",
        passed=both,
        detail="Email and phone number detected in PDF."
        if both else f"{'Email' if has_email else 'Phone'} {'found' if has_email or has_phone else 'missing'}. Include both for ATS.",
        severity="info" if both else "critical",
    )


def _check_no_header_footer_only(html: str) -> PDFATSCheckItem:
    """Some ATS skip content in <header>/<footer> tags."""
    headers = re.findall(r"<header[\s>]", html, re.IGNORECASE)
    footers = re.findall(r"<footer[\s>]", html, re.IGNORECASE)
    count = len(headers) + len(footers)
    return PDFATSCheckItem(
        check="No <header>/<footer> Tags",
        passed=count == 0,
        detail=f"Found {count} header/footer tag(s). Some ATS ignore content in these."
        if count else "No header/footer tags — content is fully parseable.",
        severity="warning" if count else "info",
    )


def _check_standard_sections(html: str) -> PDFATSCheckItem:
    """Check that common resume sections are present."""
    text_lower = re.sub(r"<[^>]+>", " ", html).lower()
    expected = ["experience", "skills", "education"]
    found = [s for s in expected if s in text_lower]
    missing = [s for s in expected if s not in text_lower]
    return PDFATSCheckItem(
        check="Standard Section Names",
        passed=len(missing) == 0,
        detail=f"Found sections: {', '.join(found)}."
        + (f" Missing: {', '.join(missing)}." if missing else " All standard sections present."),
        severity="info" if not missing else "warning",
    )


@router.post("/ats-check", response_model=PDFATSCheckResult)
async def check_pdf_ats(payload: PDFRequest):
    """
    Render the resume HTML with the chosen template and run
    ATS compliance checks on the output.
    """
    try:
        html = render_resume_html(
            resume=payload.resume,
            professional_summary=payload.professional_summary,
            template_key=payload.template,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Render failed: {exc}")

    checks = [
        _check_no_tables(html),
        _check_no_images(html),
        _check_no_columns(html),
        _check_headings(html),
        _check_readable_text(html),
        _check_contact_info(html),
        _check_no_header_footer_only(html),
        _check_standard_sections(html),
    ]

    passed = sum(1 for c in checks if c.passed)
    total = len(checks)
    score = int((passed / total) * 100)
    overall_pass = all(c.passed for c in checks if c.severity == "critical")

    critical_fails = [c.check for c in checks if not c.passed and c.severity == "critical"]
    if critical_fails:
        summary = f"⚠️ {len(critical_fails)} critical issue(s): {', '.join(critical_fails)}. Fix these for ATS compatibility."
    elif score == 100:
        summary = "✅ Perfect! Your PDF passes all ATS compliance checks."
    else:
        summary = f"✔️ Good — {passed}/{total} checks passed. Minor improvements recommended."

    return PDFATSCheckResult(
        overall_pass=overall_pass,
        score=score,
        checks=checks,
        summary=summary,
    )
