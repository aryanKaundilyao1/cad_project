from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from .enums import CommercialRoleType

class CommercialRoleAssignment(BaseModel):
    role_type: CommercialRoleType
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    evidence_ids: List[UUID] = Field(default_factory=list)
    reason: Optional[str] = None
