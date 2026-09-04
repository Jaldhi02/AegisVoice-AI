"""Persisted security-alert document shape."""

from datetime import datetime
from typing import TypedDict


class AlertDocument(TypedDict):
    call_id: str
    user_id: str | None
    risk_level: str
    risk_score: int
    message: str
    status: str
    created_at: datetime
    updated_at: datetime
