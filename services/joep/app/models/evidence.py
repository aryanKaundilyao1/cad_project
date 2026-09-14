from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class Evidence(BaseModel):
    id: UUID
    client_id: UUID
    source_url: Optional[str] = None
    publisher: Optional[str] = None
    title: Optional[str] = None
    excerpt: Optional[str] = None
    evidence_type: Optional[str] = None
    reliability_class: Optional[str] = None
    directness: Optional[float] = Field(None, ge=0.0, le=1.0)
    published_at: Optional[datetime] = None
    observed_at: datetime
    retrieved_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
