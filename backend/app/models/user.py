"""Persisted user document shape."""

from datetime import datetime
from typing import NotRequired, TypedDict


class UserDocument(TypedDict):
    email: str
    hashed_password: str
    full_name: str
    created_at: datetime
    phone: NotRequired[str | None]
