from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse, AlertListResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=AlertListResponse, status_code=status.HTTP_200_OK)
async def get_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieves list of active security alerts."""
    user_id = str(current_user["id"])
    return await AlertService.list_alerts(db=db, user_id=user_id)

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    req: AlertCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Creates a security alert record manually or from fraud rules."""
    user_id = str(current_user["id"])
    return await AlertService.create_alert(
        db=db,
        call_id=req.call_id,
        risk_level=req.risk_level,
        risk_score=req.risk_score,
        message=req.message,
        user_id=user_id
    )

@router.patch("/{id}", response_model=AlertResponse, status_code=status.HTTP_200_OK)
async def update_alert(
    id: str,
    req: AlertUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Updates status of an alert (e.g. UNREAD -> ACKNOWLEDGED -> RESOLVED)."""
    return await AlertService.update_alert(
        db=db, alert_id=id, update_data=req, user_id=str(current_user["id"])
    )
