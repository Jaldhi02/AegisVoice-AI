"""Persisted call document shape."""

from datetime import datetime
from typing import NotRequired, TypedDict

from .analysis import AnalysisDocument


class CallDocument(TypedDict):
    filename: str
    stored_filename: str
    file_path: str
    file_size: int
    duration_seconds: float
    user_id: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    analysis: NotRequired[AnalysisDocument | None]
    caller_number: NotRequired[str | None]
    receiver_number: NotRequired[str | None]
