from typing import TypeVar, Generic, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from .enums import MissingState

T = TypeVar('T')

class EvidenceBackedValue(BaseModel, Generic[T]):
    value: Optional[T] = None
    state: MissingState = MissingState.UNKNOWN
    evidence_ids: List[UUID] = Field(default_factory=list)
    source_ids: List[UUID] = Field(default_factory=list)
    observed_at: Optional[datetime] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
