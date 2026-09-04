from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AlertCreate(BaseModel):
    call_id: str
    risk_level: str = Field(..., description="LOW | MEDIUM | HIGH")
    risk_score: int = Field(..., ge=0, le=100)
    message: str

class AlertUpdate(BaseModel):
    status: str = Field(..., description="UNREAD | ACKNOWLEDGED | RESOLVED")

class AlertResponse(BaseModel):
    id: str
    call_id: str
    risk_level: str
    risk_score: int
    message: str
    status: str = "UNREAD"
    created_at: datetime
    updated_at: Optional[datetime] = None

class AlertListResponse(BaseModel):
    total: int
    alerts: List[AlertResponse]
