export type JoepMissingState = 
  | 'CONFIRMED_PRESENT'
  | 'CONFIRMED_ABSENT'
  | 'UNKNOWN'
  | 'NOT_OBSERVED'
  | 'NOT_APPLICABLE'
  | 'CONFLICTING'
  | 'ENRICHMENT_FAILED'
  | 'NEEDS_MANUAL_RESEARCH';

export type JoepGateResultState = 
  | 'PASS'
  | 'FAIL'
  | 'UNKNOWN'
  | 'RESEARCH_REQUIRED'
  | 'NOT_APPLICABLE'
  | 'NOT_EVALUABLE';

export type JoepCommercialRoleType = 
  | 'DIRECT_BUYER'
  | 'CHANNEL'
  | 'DISTRIBUTOR'
  | 'RESELLER'
  | 'SYSTEM_INTEGRATOR'
  | 'SPECIFIER'
  | 'CONSULTANT'
  | 'INFLUENCER'
  | 'PROJECT_OWNER'
  | 'PROCUREMENT_BODY'
  | 'PARTNER'
  | 'OTHER_RELEVANT_ROLE'
  | 'ROLE_UNRESOLVED'
  | 'HARD_NEGATIVE';

export type JoepOperationalStatus = 
  | 'CONTACT_NOW'
  | 'INVESTIGATE_NOW'
  | 'NURTURE'
  | 'LOW_PRIORITY'
  | 'DISQUALIFIED'
  | 'SCORING_PENDING'
  | 'SCORING_ERROR';

export type JoepOutcomeState = 
  | 'DISCOVERED'
  | 'SHOWN'
  | 'VIEWED'
  | 'ADDED_TO_CRM'
  | 'CONTACTED'
  | 'RESPONDED'
  | 'QUALIFIED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST'
  | 'NURTURE'
  | 'REJECTED';

export interface JoepCanonicalEntity {
  id: string;
  client_id: string;
  legal_name: string;
  operating_name?: string;
  website?: string;
  entity_type?: string;
  industry?: string;
  subindustry?: string;
  country?: string;
  identity_status?: string;
  identity_confidence?: number;
}

export interface JoepLeadDNA {
  id: string;
  client_id: string;
  canonical_entity_id: string;
  firmographics: Record<string, any>;
  commercial_role_hypotheses: any[];
  product_relevance: Record<string, any>;
  icp_hypotheses: any[];
  missing_states: Record<string, JoepMissingState>;
  evidence_references: any[];
}

export interface JoepOpportunity {
  id: string;
  client_id: string;
  canonical_entity_id: string;
  title: string;
  status: string;
}

export interface JoepScoreSnapshot {
  id: string;
  opportunity_id: string;
  client_id: string;
  model_version: string;
  rule_version: string;
  qualification_status: string;
  module_scores: Record<string, number>;
  opportunity_quality: number;
  evidence_confidence: number;
  commercial_value: number;
  sales_priority: number;
  research_priority: number;
  outreach_readiness: number;
  operating_status: JoepOperationalStatus;
  positive_drivers: string[];
  negative_drivers: string[];
  unknowns: string[];
  is_current: boolean;
}
