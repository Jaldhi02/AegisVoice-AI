from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Registers a new user account."""
    return await AuthService.register(db, req)

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(req: UserLoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Authenticates user and returns JWT token."""
    return await AuthService.login(db, req)

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieves profile of currently authenticated user."""
    return UserResponse(
        id=str(current_user.get("id") or current_user.get("_id", "")),
        email=current_user.get("email", ""),
        full_name=current_user.get("full_name", ""),
        phone=current_user.get("phone"),
        created_at=current_user.get("created_at")
    )
