from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.analysis import FullAnalysisResponse

class CallUploadResponse(BaseModel):
    call_id: str
    filename: str
    file_size: int
    duration_seconds: float = 0.0
    status: str = "UPLOADED"
    created_at: datetime

class CallSummaryItem(BaseModel):
    id: str
    filename: str
    caller_number: Optional[str] = None
    risk_level: Optional[str] = "UNKNOWN"
    risk_score: Optional[int] = 0
    status: str = "UPLOADED"
    created_at: datetime

class CallListResponse(BaseModel):
    total: int
    calls: List[CallSummaryItem]

class CallDetailResponse(BaseModel):
    id: str
    filename: str
    caller_number: Optional[str] = None
    receiver_number: Optional[str] = None
    file_size: int
    duration_seconds: float = 0.0
    status: str
    created_at: datetime
    analysis: Optional[FullAnalysisResponse] = None
