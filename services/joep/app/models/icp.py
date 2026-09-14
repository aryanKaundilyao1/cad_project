from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ICPDefinition(BaseModel):
    id: UUID
    client_id: UUID
    name: str

class ICPAssignment(BaseModel):
    icp_id: UUID
    is_primary: bool = False
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    reason: Optional[str] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
    classifier_version: str
    assigned_at: datetime
