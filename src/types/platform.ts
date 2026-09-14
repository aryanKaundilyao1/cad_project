// ============================================
// PLATFORM TYPES — Universal B2B Lead Intelligence
// ============================================

// ── Lead Status Enum ──
export type LeadStatusEnum = 'ACTIVE' | 'VERIFIED' | 'BUFFER' | 'ARCHIVED' | 'INVALID' | 'EXPIRED';

export const LEAD_STATUS_CONFIG_V2: Record<LeadStatusEnum, { label: string; color: string; bg: string; icon: string }> = {
  ACTIVE: { label: 'Active', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: 'Zap' },
  VERIFIED: { label: 'Verified', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: 'ShieldCheck' },
  BUFFER: { label: 'Buffer', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'Inbox' },
  ARCHIVED: { label: 'Archived', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: 'Archive' },
  INVALID: { label: 'Invalid', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'XCircle' },
  EXPIRED: { label: 'Expired', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', icon: 'Clock' },
};

// ── Allowed Status Transitions ──
export const ALLOWED_STATUS_TRANSITIONS: Record<LeadStatusEnum, LeadStatusEnum[]> = {
  ACTIVE: ['VERIFIED', 'BUFFER', 'ARCHIVED', 'INVALID'],
  VERIFIED: ['ARCHIVED', 'EXPIRED', 'ACTIVE'],
  BUFFER: ['ACTIVE', 'ARCHIVED', 'INVALID'],
  ARCHIVED: ['ACTIVE'],
  INVALID: ['ACTIVE'],
  EXPIRED: ['ACTIVE'],
};

// ── Companies ──
export type FundingStage =
  | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c'
  | 'series_d' | 'series_e' | 'ipo' | 'acquired' | 'bootstrapped'
  | 'public' | 'private';

export type CompanySource =
  | 'manual' | 'csv_import' | 'excel_import' | 'google_sheets'
  | 'api' | 'scraper' | 'enrichment' | 'chrome_extension' | 'ai_discovery';

export interface JasCompany {
  id: string;
  company_name: string;
  domain: string | null;
  website: string | null;
  linkedin_url: string | null;
  industry: string | null;
  sub_industry: string | null;
  employee_count: number | null;
  estimated_revenue: number | null;
  funding_stage: FundingStage | null;
  headquarters: string | null;
  country: string | null;
  city: string | null;
  technologies_used: string[];
  business_description: string | null;
  verified_status: LeadStatusEnum;
  lead_quality_score: number;
  source: CompanySource;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  founded_year: number | null;
  hiring_active: boolean;
  social_twitter: string | null;
  social_facebook: string | null;
  tags: string[];
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Contacts ──
export type Department =
  | 'engineering' | 'sales' | 'marketing' | 'hr' | 'finance'
  | 'operations' | 'product' | 'design' | 'legal' | 'c_suite'
  | 'support' | 'it' | 'procurement' | 'other';

export type Seniority =
  | 'intern' | 'junior' | 'mid' | 'senior' | 'lead'
  | 'manager' | 'director' | 'vp' | 'c_level' | 'founder';

export interface JasContact {
  id: string;
  first_name: string;
  last_name: string | null;
  designation: string | null;
  email: string | null;
  verified_email: boolean;
  phone: string | null;
  verified_phone: boolean;
  linkedin_profile: string | null;
  department: Department | null;
  seniority: Seniority | null;
  company_id: string | null;
  engagement_score: number;
  contact_status: LeadStatusEnum;
  source: string | null;
  photo_url: string | null;
  location: string | null;
  tags: string[];
  added_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  company_name?: string;
  company_domain?: string;
}

// ── Import Jobs ──
export interface LeadImportJob {
  id: string;
  imported_by: string;
  source_type: 'csv' | 'excel' | 'google_sheets' | 'api' | 'manual';
  entity_type: 'company' | 'contact' | 'mixed';
  file_name: string | null;
  total_records: number;
  successful: number;
  failed: number;
  duplicate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_details: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

// ── Lead Flags ──
export type FlagType =
  | 'suspicious' | 'duplicate' | 'incomplete' | 'outdated'
  | 'spam' | 'wrong_info' | 'needs_review' | 'high_priority';

export interface LeadFlag {
  id: string;
  entity_type: 'company' | 'contact';
  entity_id: string;
  flag_type: FlagType;
  flagged_by: string;
  notes: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ── Credits ──
export interface CreditPlan {
  id: string;
  plan_name: string;
  display_name: string;
  monthly_credits: number;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, boolean>;
  is_active: boolean;
  display_order: number;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  plan_id: string | null;
  total_credits: number;
  used_credits: number;
  bonus_credits: number;
  cycle_start: string;
  cycle_end: string;
}

export type CreditTransactionType =
  | 'plan_allocation' | 'unlock_contact' | 'unlock_company'
  | 'export_csv' | 'export_excel' | 'export_sheets'
  | 'ai_search' | 'ai_copilot' | 'bulk_download'
  | 'enrichment' | 'bonus' | 'refund' | 'admin_adjustment'
  | 'api_usage';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: CreditTransactionType;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ── Saved Lists ──
export interface SavedLeadList {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  description: string | null;
  filters: Record<string, any>;
  entity_type: 'company' | 'contact' | 'mixed';
  lead_count: number;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// ── AI Copilot ──
export interface AICopilotConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AICopilotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured_filters: Record<string, any> | null;
  results_count: number | null;
  credits_used: number;
  created_at: string;
}

// ── Teams ──
export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  avatar_url: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  // Joined fields
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  invited_email: string | null;
  invite_token: string;
  invite_method: 'email' | 'link' | 'workspace';
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

// ── CRM Pipeline ──
export type CRMStageSlug =
  | 'new' | 'contacted' | 'replied' | 'interested'
  | 'meeting_booked' | 'proposal_sent' | 'closed_won' | 'closed_lost';

export interface CRMPipeline {
  id: string;
  user_id: string | null;
  team_id: string | null;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMPipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  slug: string;
  color: string;
  display_order: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface CRMDeal {
  id: string;
  pipeline_id: string;
  stage_id: string;
  company_id: string | null;
  contact_id: string | null;
  crm_lead_id: string | null;
  owner_id: string;
  team_id: string | null;
  title: string;
  value: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  lost_reason: string | null;
  tags: string[];
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  stage_name?: string;
  stage_color?: string;
  company_name?: string;
  contact_name?: string;
}

export interface CRMDealNote {
  id: string;
  deal_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
}

export interface CRMDealTask {
  id: string;
  deal_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  assignee_name?: string;
}

export type DealActivityType =
  | 'stage_change' | 'note_added' | 'task_created' | 'task_completed'
  | 'email_sent' | 'call_logged' | 'meeting_scheduled' | 'deal_created'
  | 'deal_won' | 'deal_lost' | 'value_changed' | 'contact_added'
  | 'file_attached' | 'comment';

export interface CRMDealActivity {
  id: string;
  deal_id: string;
  user_id: string | null;
  activity_type: DealActivityType;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

// ── Outreach ──
export type OutreachChannel = 'email' | 'whatsapp' | 'linkedin' | 'sms';
export type OutreachStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface OutreachCampaign {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  channel: OutreachChannel;
  status: OutreachStatus;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  replied_count: number;
  bounced_count: number;
  clicked_count: number;
  start_date: string | null;
  end_date: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'unsubscribed';

export interface OutreachMessage {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  channel: string;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  contact_name?: string;
}

// ── Enrichment ──
export type EnrichmentType = 'email' | 'phone' | 'linkedin' | 'company_info' | 'technographics' | 'social' | 'funding' | 'full';

export interface EnrichmentRecord {
  id: string;
  user_id: string;
  entity_type: 'company' | 'contact';
  entity_id: string;
  enrichment_type: EnrichmentType;
  credits_used: number;
  previous_data: Record<string, any>;
  enriched_data: Record<string, any>;
  source: string | null;
  status: 'success' | 'failed' | 'partial';
  created_at: string;
}

// ── Integrations ──
export type IntegrationProvider =
  | 'hubspot' | 'salesforce' | 'notion' | 'airtable'
  | 'google_sheets' | 'slack' | 'zapier' | 'webhooks';

export interface IntegrationConnection {
  id: string;
  user_id: string;
  team_id: string | null;
  provider: IntegrationProvider;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  config: Record<string, any>;
  last_synced_at: string | null;
  created_at: string;
}

// ── Analytics ──
export type AnalyticsEventType =
  | 'lead_view' | 'lead_unlock' | 'lead_export' | 'lead_save'
  | 'search_performed' | 'ai_query' | 'deal_created' | 'deal_won'
  | 'deal_lost' | 'email_sent' | 'campaign_started' | 'enrichment_done'
  | 'contact_added' | 'company_added' | 'list_created' | 'team_created'
  | 'integration_connected' | 'page_view';

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  team_id: string | null;
  event_type: AnalyticsEventType;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ── Competitor Tracking ──
export interface CompetitorEntry {
  id: string;
  user_id: string;
  company_id: string;
  notes: string | null;
  alert_on_hiring: boolean;
  alert_on_funding: boolean;
  alert_on_growth: boolean;
  created_at: string;
  // Joined
  company?: JasCompany;
}

// ── AI Suggestions ──
export type AISuggestionType =
  | 'lead_recommendation' | 'campaign_idea' | 'outreach_copy'
  | 'company_summary' | 'follow_up' | 'prospect_score';

export interface AISuggestion {
  id: string;
  user_id: string;
  suggestion_type: AISuggestionType;
  title: string;
  content: string;
  metadata: Record<string, any>;
  is_dismissed: boolean;
  is_actioned: boolean;
  created_at: string;
  expires_at: string;
}

// ── Visitor Tracking ──
export interface VisitorSession {
  id: string;
  visitor_ip: string | null;
  country: string | null;
  city: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_id: string | null;
  total_pages: number;
  total_duration_seconds: number;
  lead_intent_score: number;
  first_visit_at: string;
  last_activity_at: string;
}

// ── Search Filters ──
export interface CompanySearchFilters {
  query?: string;
  industry?: string;
  country?: string;
  city?: string;
  min_employees?: number;
  max_employees?: number;
  funding_stage?: FundingStage;
  technology?: string;
  verified_only?: boolean;
  min_score?: number;
  sort_by?: 'relevance' | 'score' | 'newest' | 'employees';
  page?: number;
  page_size?: number;
}

export interface ContactSearchFilters {
  query?: string;
  company_id?: string;
  department?: Department;
  seniority?: Seniority;
  verified_only?: boolean;
  min_score?: number;
  country?: string;
  page?: number;
  page_size?: number;
}

// ── Integration Config Maps ──
export const INTEGRATION_CONFIGS: Record<IntegrationProvider, { name: string; icon: string; color: string; description: string }> = {
  hubspot: { name: 'HubSpot', icon: 'Hub', color: '#FF7A59', description: 'Sync contacts and deals with HubSpot CRM' },
  salesforce: { name: 'Salesforce', icon: 'Cloud', color: '#00A1E0', description: 'Connect with Salesforce for enterprise CRM sync' },
  notion: { name: 'Notion', icon: 'BookOpen', color: '#000000', description: 'Export lead lists to Notion databases' },
  airtable: { name: 'Airtable', icon: 'Grid3x3', color: '#18BFFF', description: 'Sync data with Airtable bases' },
  google_sheets: { name: 'Google Sheets', icon: 'Sheet', color: '#0F9D58', description: 'Export and sync with Google Sheets' },
  slack: { name: 'Slack', icon: 'MessageSquare', color: '#4A154B', description: 'Get notifications and updates in Slack' },
  zapier: { name: 'Zapier', icon: 'Zap', color: '#FF4A00', description: 'Connect with 5000+ apps via Zapier' },
  webhooks: { name: 'Webhooks', icon: 'Webhook', color: '#6B7280', description: 'Send real-time data to your endpoints' },
};

// ── Department & Seniority Display Configs ──
export const DEPARTMENT_CONFIG: Record<Department, { label: string; color: string }> = {
  engineering: { label: 'Engineering', color: '#6366F1' },
  sales: { label: 'Sales', color: '#10B981' },
  marketing: { label: 'Marketing', color: '#EC4899' },
  hr: { label: 'Human Resources', color: '#F59E0B' },
  finance: { label: 'Finance', color: '#059669' },
  operations: { label: 'Operations', color: '#64748B' },
  product: { label: 'Product', color: '#8B5CF6' },
  design: { label: 'Design', color: '#F43F5E' },
  legal: { label: 'Legal', color: '#6B7280' },
  c_suite: { label: 'C-Suite', color: '#D97706' },
  support: { label: 'Support', color: '#0EA5E9' },
  it: { label: 'IT', color: '#14B8A6' },
  procurement: { label: 'Procurement', color: '#A855F7' },
  other: { label: 'Other', color: '#9CA3AF' },
};

export const SENIORITY_CONFIG: Record<Seniority, { label: string; level: number }> = {
  intern: { label: 'Intern', level: 1 },
  junior: { label: 'Junior', level: 2 },
  mid: { label: 'Mid-Level', level: 3 },
  senior: { label: 'Senior', level: 4 },
  lead: { label: 'Lead', level: 5 },
  manager: { label: 'Manager', level: 6 },
  director: { label: 'Director', level: 7 },
  vp: { label: 'VP', level: 8 },
  c_level: { label: 'C-Level', level: 9 },
  founder: { label: 'Founder', level: 10 },
};

export const FUNDING_STAGE_CONFIG: Record<FundingStage, { label: string; color: string }> = {
  pre_seed: { label: 'Pre-Seed', color: '#9CA3AF' },
  seed: { label: 'Seed', color: '#6366F1' },
  series_a: { label: 'Series A', color: '#8B5CF6' },
  series_b: { label: 'Series B', color: '#A855F7' },
  series_c: { label: 'Series C', color: '#EC4899' },
  series_d: { label: 'Series D', color: '#F43F5E' },
  series_e: { label: 'Series E', color: '#EF4444' },
  ipo: { label: 'IPO', color: '#10B981' },
  acquired: { label: 'Acquired', color: '#F59E0B' },
  bootstrapped: { label: 'Bootstrapped', color: '#14B8A6' },
  public: { label: 'Public', color: '#3B82F6' },
  private: { label: 'Private', color: '#64748B' },
};

// ── Credit Costs ──
export const CREDIT_COSTS: Record<string, number> = {
  unlock_contact: 1,
  unlock_company: 1,
  export_csv: 2,
  export_excel: 3,
  export_sheets: 3,
  ai_search: 1,
  ai_copilot: 2,
  bulk_download: 5,
  enrichment: 3,
};
