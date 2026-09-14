export type StakeholderRoleCategory = 
  | 'DECISION_MAKER' 
  | 'EVALUATOR' 
  | 'INFLUENCER' 
  | 'SPONSOR' 
  | 'BLOCKER' 
  | 'UNKNOWN';

export interface StakeholderRoleDefinition {
  id: string;
  role_name: string;
  description: string;
  category: StakeholderRoleCategory;
  is_active: boolean;
  created_at: string;
}

export interface BuyingCommittee {
  id: string;
  opportunity_id: string;
  health_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StakeholderStatus = 'PENDING' | 'POTENTIAL' | 'CONFIRMED' | 'REJECTED';

export interface StakeholderProfile {
  id: string;
  opportunity_id: string;
  contact_id: string;
  
  // Phase 5B Scores
  influence_score: number;
  engagement_score: number;
  sentiment_score: number;
  accessibility_score: number;
  priority_score: number;

  // Phase 5E Intelligence
  champion_status: StakeholderStatus;
  blocker_status: StakeholderStatus;
  
  // Phase 5B Metadata
  communication_metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  stakeholder_profile_id: string;
  role_definition_id: string;
  added_at: string;
}

export type RelationshipType = 
  | 'REPORTS_TO' 
  | 'INFLUENCES' 
  | 'BLOCKED_BY' 
  | 'COLLABORATES_WITH' 
  | 'APPROVES_FOR';

export interface StakeholderRelationship {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  relationship_type: RelationshipType;
  strength: number; // 1-10
  created_at: string;
  updated_at: string;
}
