from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from .enums import GateResultState

class GateDefinition(BaseModel):
    id: UUID
    client_id: UUID
    gate_code: str
    name: str

class GateResult(BaseModel):
    gate_code: str
    gate_version: str
    state: GateResultState
    reason_code: Optional[str] = None
    reason_text: Optional[str] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
    evaluated_at: datetime
    rule_version: str
    configuration_version: str
