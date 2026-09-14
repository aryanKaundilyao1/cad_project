from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class SourceRecord(BaseModel):
    id: UUID
    client_id: UUID
    canonical_entity_id: Optional[UUID] = None
    source_provider: str
    source_type: str
    source_record_id: str
    source_url: Optional[str] = None
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    retrieved_at: datetime
    created_at: datetime
    updated_at: datetime
