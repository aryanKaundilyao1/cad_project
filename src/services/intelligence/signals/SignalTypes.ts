import { SignalCategory, SignalConfidence, SignalSeverity, SignalStatus } from './SignalEnums';

export interface OpportunitySignalDefinition {
  id: string;
  name: string;
  category: SignalCategory;
  default_severity: SignalSeverity;
  default_confidence: SignalConfidence;
  default_impact: number;
  default_expiration_days: number;
  validation_rules: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpportunitySignal {
  id: string;
  opportunity_id: string;
  contact_id?: string;
  definition_id?: string;
  
  signal_type: string;
  signal_category: SignalCategory;
  
  severity: SignalSeverity;
  confidence: SignalConfidence;
  impact_score: number;
  source: string;
  
  evidence: any;
  confidence_reason?: string;
  severity_reason?: string;
  
  detected_at: string;
  decay_start?: string;
  expires_at?: string;
  status: SignalStatus;
  
  created_at: string;
  updated_at: string;
}
