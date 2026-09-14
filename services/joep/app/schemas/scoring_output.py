from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import QualificationStatus, CommercialRoleType, OperationalStatus
from app.models.research import ResearchTask

class OutputMetadata(BaseModel):
    model_version: str
    rule_version: str
    client_configuration_version: Optional[str] = None
    scored_at: datetime

class OutputAggregates(BaseModel):
    opportunity_quality: Optional[float] = Field(None, ge=0.0, le=1.0)
    evidence_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    commercial_value: Optional[float] = None
    timing: Optional[float] = Field(None, ge=0.0, le=1.0)

class OutputPriorities(BaseModel):
    sales_priority: Optional[float] = Field(None, ge=0.0, le=1.0)
    research_priority: Optional[float] = Field(None, ge=0.0, le=1.0)
    outreach_readiness: Optional[float] = Field(None, ge=0.0, le=1.0)

class OutputExplainability(BaseModel):
    positive_drivers: List[str] = Field(default_factory=list)
    negative_drivers: List[str] = Field(default_factory=list)
    unknowns: List[str] = Field(default_factory=list)

class ScoringOutput(BaseModel):
    opportunity_id: UUID
    client_id: UUID
    metadata: OutputMetadata
    qualification_status: QualificationStatus
    commercial_role: Optional[CommercialRoleType] = None
    primary_icp: Optional[UUID] = None
    product_matches: List[UUID] = Field(default_factory=list)
    module_scores: Dict[str, float] = Field(default_factory=dict)
    aggregates: OutputAggregates
    priorities: OutputPriorities
    operating_status: Optional[OperationalStatus] = None
    explainability: OutputExplainability
    research_tasks: List[ResearchTask] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
