from fastapi import APIRouter, HTTPException
from app.schemas.scoring_input import ScoringInput
from app.schemas.scoring_output import ScoringOutput

router = APIRouter()

@router.post("/validate/scoring-input")
def validate_scoring_input(payload: ScoringInput):
    return {"valid": True}

@router.post("/validate/scoring-output")
def validate_scoring_output(payload: ScoringOutput):
    return {"valid": True}
