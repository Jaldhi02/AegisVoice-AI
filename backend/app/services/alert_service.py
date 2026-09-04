from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pymongo import ReturnDocument

from app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse, AlertListResponse

_alerts: dict[str, dict] = {}
_NOW = lambda: datetime.now(timezone.utc)


def _to_response(item: dict, alert_id: str) -> AlertResponse:
    return AlertResponse(
        id=str(item.get("_id", alert_id)),
        call_id=item.get("call_id", ""),
        risk_level=item.get("risk_level", "LOW"),
        risk_score=item.get("risk_score", 0),
        message=item.get("message", ""),
        status=item.get("status", "UNREAD"),
        created_at=item.get("created_at", _NOW()),
        updated_at=item.get("updated_at"),
    )


class AlertService:
    @staticmethod
    async def create_alert(
        db: Optional[AsyncIOMotorDatabase],
        call_id: str,
        risk_level: str,
        risk_score: int,
        message: str,
        user_id: Optional[str] = None,
    ) -> AlertResponse:
        """Creates an alert record in DB or in-memory fallback."""
        now = _NOW()
        doc = {
            "call_id": call_id,
            "user_id": user_id,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "message": message,
            "status": "UNREAD",
            "created_at": now,
            "updated_at": now,
        }

        alert_id = str(ObjectId())
        if db is not None:
            try:
                res = await db["alerts"].insert_one(doc)
                alert_id = str(res.inserted_id)
            except Exception:
                _alerts[alert_id] = {**doc, "_id": alert_id}
        else:
            _alerts[alert_id] = {**doc, "_id": alert_id}

        return AlertResponse(id=alert_id, call_id=call_id, risk_level=risk_level,
                             risk_score=risk_score, message=message, status="UNREAD",
                             created_at=now, updated_at=now)

    @staticmethod
    async def list_alerts(
        db: Optional[AsyncIOMotorDatabase],
        user_id: Optional[str] = None,
    ) -> AlertListResponse:
        """Returns all alerts for a user, newest first."""
        if db is not None:
            try:
                query = {"user_id": user_id} if user_id else {}
                items = [
                    _to_response(item, str(item["_id"]))
                    async for item in db["alerts"].find(query).sort("created_at", -1)
                ]
                return AlertListResponse(total=len(items), alerts=items)
            except Exception:
                pass

        # In-memory fallback
        filtered = [a for a in _alerts.values() if not user_id or a.get("user_id") == user_id]
        filtered.sort(key=lambda x: x.get("created_at", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
        return AlertListResponse(
            total=len(filtered),
            alerts=[_to_response(a, str(a.get("_id", ""))) for a in filtered],
        )

    @staticmethod
    async def update_alert(
        db: Optional[AsyncIOMotorDatabase],
        alert_id: str,
        update_data: AlertUpdate,
        user_id: Optional[str] = None,
    ) -> AlertResponse:
        """Updates alert status. Allowed: UNREAD | ACKNOWLEDGED | RESOLVED."""
        valid = {"UNREAD", "ACKNOWLEDGED", "RESOLVED"}
        new_status = update_data.status.upper()
        if new_status not in valid:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid status '{update_data.status}'. Allowed: {', '.join(sorted(valid))}",
            )

        now = _NOW()
        alert = None
        if db is not None:
            try:
                alert = await db["alerts"].find_one_and_update(
                    {"_id": ObjectId(alert_id), **({"user_id": user_id} if user_id else {})},
                    {"$set": {"status": new_status, "updated_at": now}},
                    return_document=ReturnDocument.AFTER,
                )
            except Exception:
                pass

        if not alert:
            rec = _alerts.get(alert_id)
            if rec and user_id and rec.get("user_id") != user_id:
                rec = None
            if rec:
                rec["status"] = new_status
                rec["updated_at"] = now
                alert = rec

        if not alert:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Alert '{alert_id}' not found")

        return _to_response({**alert, "status": new_status, "updated_at": now}, alert_id)
