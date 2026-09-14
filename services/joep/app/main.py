from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.api import api_router
from app.core.config import settings
from app.core.exceptions import JoepBaseException

app = FastAPI(
    title="JOEP Scoring Engine",
    version=settings.JOEP_SERVICE_VERSION,
    description="JAS Opportunity Engine (JOEP) v2"
)

@app.exception_handler(JoepBaseException)
async def joep_exception_handler(request: Request, exc: JoepBaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details
        }
    )

app.include_router(api_router)
