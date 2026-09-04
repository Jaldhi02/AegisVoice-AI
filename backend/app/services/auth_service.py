from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse

# Module-level in-memory fallback (used when MongoDB is unavailable)
_users: dict[str, dict] = {}


def _build_user_response(user: dict, user_id: str) -> UserResponse:
    return UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user.get("full_name", ""),
        phone=user.get("phone"),
        created_at=user.get("created_at"),
    )


class AuthService:
    @staticmethod
    async def register(db: Optional[AsyncIOMotorDatabase], req: UserRegisterRequest) -> UserResponse:
        """Registers a new user, storing in MongoDB or in-memory fallback."""
        email = req.email.lower().strip()

        # Duplicate check (DB first, then in-memory)
        if db is not None:
            try:
                if await db["users"].find_one({"email": email}):
                    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
            except HTTPException:
                raise
            except Exception:
                pass
        if email in _users:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

        now = datetime.now(timezone.utc)
        doc = {
            "email": email,
            "hashed_password": get_password_hash(req.password),
            "full_name": req.full_name.strip(),
            "phone": req.phone,
            "created_at": now,
        }

        user_id = str(ObjectId())
        if db is not None:
            try:
                result = await db["users"].insert_one(doc)
                user_id = str(result.inserted_id)
            except Exception:
                _users[email] = {**doc, "_id": user_id}
        else:
            _users[email] = {**doc, "_id": user_id}

        return UserResponse(id=user_id, email=email, full_name=req.full_name,
                            phone=req.phone, created_at=now)

    @staticmethod
    async def login(db: Optional[AsyncIOMotorDatabase], req: UserLoginRequest) -> TokenResponse:
        """Authenticates credentials and returns a JWT token."""
        email = req.email.lower().strip()
        user = None

        if db is not None:
            try:
                user = await db["users"].find_one({"email": email})
            except Exception:
                pass
        if not user:
            user = _users.get(email)

        if not user or not verify_password(req.password, user.get("hashed_password", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = str(user["_id"])
        token = create_access_token({"sub": user_id, "email": user["email"],
                                     "full_name": user.get("full_name", "")})
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=_build_user_response(user, user_id),
        )
