from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pypdf import PdfReader
from docx import Document

from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/files/extract-text")
async def extract_text_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Extract plain text from uploaded requirement files.
    Supported: PDF, DOCX, TXT/MD.
    """
    _ = current_user  # Ensure authenticated access

    filename = file.filename or "uploaded_file"
    lower_name = filename.lower()
    data = await file.read()

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        if lower_name.endswith(".pdf") or file.content_type == "application/pdf":
            reader = PdfReader(BytesIO(data))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(page_text)
            text = "\n".join(text_parts).strip()
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No selectable text found in this PDF.",
                )
            return {"text": text}

        if (
            lower_name.endswith(".docx")
            or file.content_type
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            document = Document(BytesIO(data))
            text = "\n".join(
                paragraph.text for paragraph in document.paragraphs if paragraph.text
            ).strip()
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No text found in this DOCX file.",
                )
            return {"text": text}

        if lower_name.endswith(".doc") or file.content_type == "application/msword":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Legacy .doc is not supported. Please convert to .docx or PDF.",
            )

        if lower_name.endswith((".txt", ".md", ".markdown")) or file.content_type in {
            "text/plain",
            "text/markdown",
        }:
            text = data.decode("utf-8", errors="ignore").strip()
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No text found in this text file.",
                )
            return {"text": text}

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Use PDF, DOCX, TXT, or MD.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not extract text from file: {exc}",
        ) from exc
