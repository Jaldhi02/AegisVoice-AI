import os
import pathlib
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Ensure upload directory exists once at import time
pathlib.Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

_MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024
_CHUNK = 65536  # 64 KB read chunks


def _get_extension(filename: str) -> str:
    return pathlib.Path(filename.lower()).suffix


def validate_audio_file(file: UploadFile) -> None:
    """Raises HTTP 400 for unsupported audio formats."""
    ext = _get_extension(file.filename or "")
    if ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported audio format '{ext}'. "
                f"Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
            ),
        )
    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded content must have an audio MIME type",
        )


async def save_upload_file(file: UploadFile) -> tuple[str, str, int]:
    """
    Validates, streams, and saves an audio upload.
    Returns: (file_path, unique_filename, size_in_bytes)
    Raises HTTP 413 if file exceeds MAX_FILE_SIZE_MB.
    """
    validate_audio_file(file)

    ext = _get_extension(file.filename or "audio.wav")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    total = 0
    try:
        async with aiofiles.open(file_path, "wb") as out:
            while chunk := await file.read(_CHUNK):
                total += len(chunk)
                if total > _MAX_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds {settings.MAX_FILE_SIZE_MB} MB limit",
                    )
                await out.write(chunk)
    except HTTPException:
        # Clean up partial file before re-raising
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    if total == 0:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file cannot be empty",
        )

    return file_path, unique_name, total
