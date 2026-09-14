from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class Opportunity(BaseModel):
    id: UUID
    client_id: UUID
    canonical_entity_id: UUID
    title: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
