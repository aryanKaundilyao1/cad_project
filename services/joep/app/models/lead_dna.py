from pydantic import BaseModel, Field
from typing import Dict, Any, List
from uuid import UUID
from .enums import MissingState

class LeadDNA(BaseModel):
    firmographics: Dict[str, Any] = Field(default_factory=dict)
    commercial_role_hypotheses: List[Any] = Field(default_factory=list)
    product_relevance: Dict[str, Any] = Field(default_factory=dict)
    icp_hypotheses: List[Any] = Field(default_factory=list)
    missing_states: Dict[str, MissingState] = Field(default_factory=dict)
    evidence_references: List[UUID] = Field(default_factory=list)
