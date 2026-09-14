from fastapi import APIRouter
from app.core.exceptions import ScoringNotImplementedError

router = APIRouter()

@router.post("/score")
def score_lead():
    raise ScoringNotImplementedError()
