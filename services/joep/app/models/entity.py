from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class CanonicalEntity(BaseModel):
    id: UUID
    client_id: UUID
    canonical_name: str
    domain: Optional[str] = None
    website: Optional[str] = None
    entity_type: Optional[str] = None
    industry: Optional[str] = None
    subindustry: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    identity_status: Optional[str] = None
    identity_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    created_at: datetime
    updated_at: datetime
