"""Media upload storage abstraction supporting local /uploads and optional S3/R2 buckets."""

import mimetypes
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def save_upload_file(filename: Optional[str], content: bytes) -> dict:
    """Validate and persist an uploaded product asset using local disk or S3/R2 object storage."""
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB upload limit")

    ext = Path(filename or "image.png").suffix.lower() or ".png"
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use PNG, JPG, WEBP, GIF, or SVG.")

    backend = os.getenv("UPLOAD_BACKEND", "local").lower()
    safe_name = f"{uuid.uuid4().hex[:12]}{ext}"

    if backend == "local":
        (UPLOAD_DIR / safe_name).write_bytes(content)
        public_base = os.getenv("PUBLIC_API_URL", "http://localhost:8000").rstrip("/")
        return {"url": f"{public_base}/uploads/{safe_name}", "filename": safe_name, "backend": "local"}

    if backend in ("s3", "r2"):
        bucket = os.getenv("S3_BUCKET", "").strip()
        if not bucket:
            raise HTTPException(status_code=501, detail="S3_BUCKET environment variable is not configured")
        try:
            import boto3  # type: ignore
        except ImportError as exc:
            raise HTTPException(status_code=501, detail="boto3 package is required for S3/R2 uploads") from exc

        key = f"copian-products/{safe_name}"
        content_type = mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
        endpoint_url = os.getenv("S3_ENDPOINT_URL", "").strip() or None
        client = boto3.client("s3", endpoint_url=endpoint_url)
        client.put_object(Bucket=bucket, Key=key, Body=content, ContentType=content_type)
        public_base = os.getenv("S3_PUBLIC_URL", "").strip().rstrip("/") or f"https://{bucket}.s3.amazonaws.com"
        return {"url": f"{public_base}/{key}", "filename": safe_name, "backend": backend}

    raise HTTPException(status_code=501, detail=f"Configured UPLOAD_BACKEND '{backend}' is not provisioned")
