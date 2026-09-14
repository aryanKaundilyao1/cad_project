from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID

class ClientConfiguration(BaseModel):
    client_id: UUID
    configuration_version: str
    active_products: List[UUID] = Field(default_factory=list)
    active_icps: List[UUID] = Field(default_factory=list)
    gate_configuration: Dict[str, Any] = Field(default_factory=dict)
    scoring_configuration: Dict[str, Any] = Field(default_factory=dict)
    signal_configuration: Dict[str, Any] = Field(default_factory=dict)
    market_configuration: Dict[str, Any] = Field(default_factory=dict)
