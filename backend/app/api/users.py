from fastapi import APIRouter, Depends, status
from app.core.dependencies import get_current_user
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Fetches user profile."""
    return UserResponse(
        id=str(current_user.get("id") or current_user.get("_id", "")),
        email=current_user.get("email", ""),
        full_name=current_user.get("full_name", ""),
        phone=current_user.get("phone"),
        created_at=current_user.get("created_at")
    )
