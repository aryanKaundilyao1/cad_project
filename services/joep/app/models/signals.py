from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from .enums import MissingState

class SignalDefinition(BaseModel):
    id: UUID
    client_id: UUID
    name: str

class EventCluster(BaseModel):
    id: UUID
    client_id: UUID

class SignalObservation(BaseModel):
    signal_id: UUID
    event_cluster_id: Optional[UUID] = None
    evidence_id: Optional[UUID] = None
    value: Dict[str, Any] = Field(default_factory=dict)
    evidence_state: MissingState = MissingState.CONFIRMED_PRESENT
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    published_at: Optional[datetime] = None
    observed_at: datetime
    effective_at: Optional[datetime] = None
    valid_until: Optional[datetime] = None
