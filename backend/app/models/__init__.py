"""MongoDB document type definitions used by the backend services.

These types describe persisted documents only. Request and response validation
continues to live in ``app.schemas``.
"""

from .alert import AlertDocument
from .analysis import AnalysisDocument
from .call import CallDocument
from .user import UserDocument

__all__ = ["AlertDocument", "AnalysisDocument", "CallDocument", "UserDocument"]
