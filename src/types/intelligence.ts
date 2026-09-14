// Intelligence System TypeScript Types

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_active: boolean;
  display_order: number;
  lead_count: number;
  created_at: string;
}

export interface Subcategory {
  id: string;
  industry_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export interface TargetAudience {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
}

export interface TargetGeography {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
}

export interface IdealLeadType {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  industry_id: string | null;
  subcategory_id: string | null;
  target_audience: string[];
  target_geography: string[];
  services_products: string | null;
  ideal_lead_types: string[];
  team_size: string | null;
  monthly_lead_requirement: string | null;
  business_niche?: string | null;
  ai_classification_vector: Record<string, any>;
  onboarding_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  industry?: Industry;
  subcategory?: Subcategory;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action_type: 'search' | 'view_lead' | 'unlock_lead' | 'export' | 'crm_interaction' | 'filter_applied' | 'lead_saved';
  metadata: Record<string, any>;
  created_at: string;
}

export interface OnboardingFormData {
  companyName: string;
  industryId: string;
  subcategoryId: string;
  targetAudience: string[];
  targetGeography: string[];
  servicesProducts: string;
  idealLeadTypes: string[];
  teamSize: string;
  monthlyLeadRequirement: string;
}

export interface AIClassification {
  industry_id: string | null;
  industry_name: string | null;
  subcategory_id: string | null;
  subcategory_name: string | null;
  tags: string[];
  confidence: number; // 0-1
  reasoning: string;
}

export interface SearchIntent {
  query: string;
  industry: string | null;
  geography: string | null;
  companyType: string | null;
  companySize: string | null;
  keywords: string[];
  filters: Record<string, any>;
}

export interface LeadMatchScore {
  lead_id: string;
  score: number; // 0-100
  reasons: string[];
}

export const TEAM_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
] as const;

export const LEAD_REQUIREMENTS = [
  '1-10 per month',
  '11-50 per month',
  '51-100 per month',
  '100+ per month',
] as const;

export type TeamSize = typeof TEAM_SIZES[number];
export type LeadRequirement = typeof LEAD_REQUIREMENTS[number];
