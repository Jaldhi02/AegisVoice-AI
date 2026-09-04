import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.calls import router as calls_router
from app.api.analysis import router as analysis_router
from app.api.alerts import router as alerts_router
from app.api.reports import router as reports_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI Voice Fraud Detection Backend...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down backend services...")
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FastAPI backend for real-time AI voice fraud, voice cloning & deepfake detection.",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Credentialed requests must only be accepted from explicitly configured origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def _validation_error(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


_PREFIX = settings.API_PREFIX
for router in (auth_router, users_router, calls_router, analysis_router, alerts_router, reports_router):
    app.include_router(router, prefix=_PREFIX)


@app.get("/", tags=["Health"])
async def root():
    return {"project": settings.PROJECT_NAME, "version": settings.VERSION,
            "status": "healthy", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy" if settings.PROJECT_NAME else "unhealthy"}
