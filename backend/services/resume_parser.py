"""
ATS Resume Builder — Resume File Parser
=========================================
Extracts plain text from PDF and DOCX files.
"""

import io


def extract_text_from_file(file_bytes: bytes, extension: str) -> str:
    """
    Extract text from a PDF or DOCX file given raw bytes and extension.
    Returns plain text string.
    """
    ext = extension.lower().strip(".")
    if ext == "pdf":
        return _extract_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return _extract_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def _extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    import pdfplumber

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)
