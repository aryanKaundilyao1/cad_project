// CRM System Types

export interface CrmLead {
  id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  source_type: 'verified' | 'auto';
  source_origin: 'admin_manual' | 'admin_bulk' | 'platform' | 'ads' | 'api' | 'marketplace_unlock';
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  location: string | null;
  requirement: string | null;
  status: 'pending' | 'contacted' | 'qualified' | 'in_discussion' | 'converted' | 'lost' | 'new';
  notes: string | null;
  website: string | null;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  total_area: string | null;
  industry_id: string | null;
  company_size: string | null;
  lead_source: string | null;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotaTracking {
  id: string;
  user_id: string;
  month: string;
  plan_name: string;
  quota_limit: number;
  delivered: number;
  extra_purchased: number;
  created_at: string;
  updated_at: string;
}

export interface LeadLog {
  id: string;
  crm_lead_id: string;
  action: 'created' | 'assigned' | 'status_changed' | 'bulk_imported' | 'deleted';
  performed_by: string | null;
  details: Record<string, any>;
  created_at: string;
}

// Lead feedback types (user-submitted)
export interface LeadFeedback {
  id: string;
  lead_id: string;
  user_id: string;
  feedback_type: 'converted_successfully' | 'in_discussion' | 'not_interested' | 'wrong_lead' | 'no_response';
  notes: string | null;
  created_at: string;
}

// Conversion review (admin queue)
export interface ConversionReview {
  id: string;
  lead_id: string;
  submitted_by: string;
  feedback_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Plan quota definitions
export const PLAN_QUOTAS: Record<string, { label: string; quotas: Record<string, number> }> = {
  free: { label: 'Free', quotas: { '1m': 0, '3m': 0, '1y': 0 } },
  basic: { label: 'Basic', quotas: { '1m': 40, '3m': 150, '1y': 1000 } },
  premium: { label: 'Premium', quotas: { '1m': 80, '3m': 300, '1y': 3000 } },
  elite: { label: 'Elite', quotas: { '1m': 250, '3m': 800, '1y': Infinity } },
};

// Get quota limit for a plan
export const getQuotaForPlan = (plan: string, billingCycle: string = '1y'): number => {
  return PLAN_QUOTAS[plan]?.quotas[billingCycle] ?? 0;
};

// Lead status color mapping — user-selectable statuses
// NOTE: 'converted' is admin-only; users select feedback instead
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  pending: { label: 'Pending', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  contacted: { label: 'Contacted', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  qualified: { label: 'Qualified', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  in_discussion: { label: 'In Discussion', color: '#22D3EE', bg: 'rgba(34,211,238,0.12)' },
  converted: { label: 'Converted', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  lost: { label: 'Lost', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

// User-selectable statuses (excludes 'converted' — admin only)
export const USER_STATUS_OPTIONS = ['new', 'pending', 'contacted', 'qualified', 'in_discussion', 'lost'];

// Feedback options for lead lifecycle
export const FEEDBACK_OPTIONS = [
  { value: 'converted_successfully', label: 'Converted Successfully', icon: '✅', color: '#10B981' },
  { value: 'in_discussion', label: 'In Discussion', icon: '💬', color: '#22D3EE' },
  { value: 'not_interested', label: 'Not Interested', icon: '❌', color: '#EF4444' },
  { value: 'wrong_lead', label: 'Wrong Lead', icon: '⚠️', color: '#F59E0B' },
  { value: 'no_response', label: 'No Response', icon: '📭', color: '#6B7280' },
];

// Badge display config
export const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  converted: { label: 'Converted', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  high_intent: { label: 'High Intent', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  verified_conversion: { label: 'Verified Conversion', color: '#22D3EE', bg: 'rgba(34,211,238,0.12)' },
  popular: { label: 'Popular', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  trending: { label: 'Trending', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
};

export const EXTRA_LEAD_PRICE = 99; // ₹99 per extra lead
