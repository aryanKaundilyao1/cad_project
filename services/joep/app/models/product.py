from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from .enums import MissingState

class Product(BaseModel):
    id: UUID
    client_id: UUID
    name: str

class ProductMatch(BaseModel):
    product_id: UUID
    match_state: MissingState = MissingState.UNKNOWN
    match_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    reason: Optional[str] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
