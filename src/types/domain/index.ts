export interface BaseEntity {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity extends BaseEntity {
  account_id: string;
  legacy_lead_id?: string;
  title: string;
  description?: string;
  industry?: string;
  stage: 'qualification' | 'validation' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'won' | 'lost' | 'archived';
  expected_close_date?: string;
  estimated_value?: number;
  assigned_to?: string;
  created_by?: string;
}

export interface IntelligenceSnapshot {
  opportunity_id: string;
  account_id: string;
  title: string;
  fit_score: number;
  intent_score: number;
  timing_score: number;
  engagement_score: number;
  opportunity_score: number;
  purchase_probability: number;
  confidence_score: number;
  recommended_action: string | null;
  urgency: string | null;
  latest_signal_date: string | null;
}

export interface TimelineEvent {
  event_id: string;
  event_type: 'activity' | 'task' | 'signal' | 'system';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  actor_name: string;
  metadata?: Record<string, any>;
}
