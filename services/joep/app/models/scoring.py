from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from .enums import QualificationStatus, OperationalStatus

class ScoreSnapshot(BaseModel):
    id: UUID
    client_id: UUID
    opportunity_id: UUID
    model_version: str
    rule_version: str
    client_configuration_version: Optional[str] = None
    feature_version: Optional[str] = None
    qualification_status: QualificationStatus
    module_scores: Dict[str, float] = Field(default_factory=dict)
    opportunity_quality: Optional[float] = Field(None, ge=0.0, le=1.0)
    evidence_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    commercial_value: Optional[float] = None
    timing_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    sales_priority: Optional[float] = Field(None, ge=0.0, le=1.0)
    research_priority: Optional[float] = Field(None, ge=0.0, le=1.0)
    outreach_readiness: Optional[float] = Field(None, ge=0.0, le=1.0)
    operating_status: Optional[OperationalStatus] = None
    positive_drivers: List[str] = Field(default_factory=list)
    negative_drivers: List[str] = Field(default_factory=list)
    unknowns: List[str] = Field(default_factory=list)
    scored_at: datetime
    trigger_reason: Optional[str] = None
    is_current: bool = True
