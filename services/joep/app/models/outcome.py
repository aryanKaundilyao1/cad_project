from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from .enums import OutcomeState

class Outcome(BaseModel):
    id: UUID
    client_id: UUID
    opportunity_id: UUID
    state: OutcomeState
    notes: Optional[str] = None
    logged_at: datetime
