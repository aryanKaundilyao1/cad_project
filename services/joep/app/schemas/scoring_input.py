from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import MissingState, GateResultState, CommercialRoleType
from app.models.lead_dna import LeadDNA
from app.models.gates import GateResult
from app.models.icp import ICPAssignment
from app.models.product import ProductMatch
from app.models.signals import SignalObservation
from app.models.evidence import Evidence
from app.models.commercial_role import CommercialRoleAssignment

class InputClientConfig(BaseModel):
    client_id: UUID
    configuration_version: str
    active_products: List[UUID] = Field(default_factory=list)
    active_icps: List[UUID] = Field(default_factory=list)

class InputEntity(BaseModel):
    canonical_entity_id: UUID
    canonical_name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    subindustry: Optional[str] = None
    country: Optional[str] = None

class InputRawSource(BaseModel):
    source_provider: str
    source_type: str
    source_record_id: str
    raw_payload_hash: Optional[str] = None

class ScoringInput(BaseModel):
    client: InputClientConfig
    entity: InputEntity
    raw_sources: List[InputRawSource] = Field(default_factory=list)
    lead_dna: LeadDNA
    commercial_role: Optional[CommercialRoleAssignment] = None
    icp_assignments: List[ICPAssignment] = Field(default_factory=list)
    product_matches: List[ProductMatch] = Field(default_factory=list)
    gate_results: List[GateResult] = Field(default_factory=list)
    signals: List[SignalObservation] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
