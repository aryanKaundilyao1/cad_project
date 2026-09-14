from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ResearchTask(BaseModel):
    id: UUID
    client_id: UUID
    opportunity_id: UUID
    missing_fact: str
    affected_module: Optional[str] = None
    why_it_matters: Optional[str] = None
    recommended_source: Optional[str] = None
    priority: Optional[float] = Field(None, ge=0.0, le=1.0)
    expected_information_value: Optional[float] = None
    estimated_cost: Optional[float] = None
    estimated_time: Optional[float] = None
    status: str = "PENDING"
    resolution: Optional[str] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime
    resolved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
