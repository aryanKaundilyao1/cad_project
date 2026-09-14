from fastapi import APIRouter
from .health import router as health_router
from .validation import router as validation_router
from .scoring import router as scoring_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(validation_router, prefix="/v1", tags=["Validation"])
api_router.include_router(scoring_router, tags=["Scoring"])
