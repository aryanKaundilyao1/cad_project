export type PlanTier = 'free' | 'basic' | 'premium' | 'elite';
export type PlanDuration = 'monthly' | 'quarterly' | 'yearly';

export interface PlanDetails {
  tier: PlanTier;
  duration: PlanDuration;
}

export function parsePlan(planString: string | null): PlanDetails {
  if (!planString) return { tier: 'free', duration: 'monthly' };
  
  const lower = planString.toLowerCase();
  
  let tier: PlanTier = 'free';
  if (lower.includes('elite')) tier = 'elite';
  else if (lower.includes('premium')) tier = 'premium';
  else if (lower.includes('basic')) tier = 'basic';
  
  let duration: PlanDuration = 'monthly';
  if (lower.includes('quarterly')) duration = 'quarterly';
  else if (lower.includes('yearly') || lower.includes('annual')) duration = 'yearly';
  
  return { tier, duration };
}

export function getLeadAllocation(planString: string | null): number {
  const { tier, duration } = parsePlan(planString);
  
  if (tier === 'free') return 0;
  
  if (duration === 'monthly') {
    if (tier === 'basic') return 60;
    if (tier === 'premium') return 100;
    if (tier === 'elite') return 500;
  }
  
  if (duration === 'quarterly') {
    if (tier === 'basic') return 180;
    if (tier === 'premium') return 300;
    if (tier === 'elite') return 1500;
  }
  
  if (duration === 'yearly') {
    // Return a very large number to represent unlimited for UI, or handle specifically
    return 999999;
  }
  
  return 0;
}

export function hasFullDatabaseAccess(planString: string | null): boolean {
  const { duration } = parsePlan(planString);
  return duration === 'yearly';
}

export function canUseCRM(planString: string | null): boolean {
  const { tier } = parsePlan(planString);
  return tier === 'basic' || tier === 'premium' || tier === 'elite';
}

export function canUseAI(planString: string | null): boolean {
  const { tier } = parsePlan(planString);
  return tier === 'premium' || tier === 'elite';
}

export function canUseProjectManagement(planString: string | null): boolean {
  const { tier } = parsePlan(planString);
  return tier === 'elite';
}

export function canUseUnlimitedExports(planString: string | null): boolean {
  const { tier, duration } = parsePlan(planString);
  return tier === 'elite' && duration === 'yearly';
}

export function getPlanFeatures(planString: string | null): string[] {
  const { tier, duration } = parsePlan(planString);
  const isYearly = duration === 'yearly';
  
  const freeFeatures = ['Browse Leads', 'View Previews', 'Save Leads', 'Pay Per Lead (₹99)'];
  const basicFeatures = ['CRM', 'Lead Tracking', 'Saved Leads', 'Email Templates'];
  const premiumFeatures = [...basicFeatures, 'AI Outreach', 'Priority Leads', 'Analytics Dashboard'];
  const eliteFeatures = [...premiumFeatures, 'AI Automation', 'Competitor Insights', 'Lead Intelligence', 'Project Management', 'Priority Support'];
  
  let features: string[] = [];
  
  if (tier === 'free') features = freeFeatures;
  if (tier === 'basic') features = basicFeatures;
  if (tier === 'premium') features = premiumFeatures;
  if (tier === 'elite') {
    features = isYearly 
      ? [
          'Unlimited Database Access', 'AI Outreach', 'AI Forecasting', 'Tender Alerts', 
          'Competitor Intelligence', 'Lead Intelligence', 'Project Management', 
          'Priority Support', 'Dedicated Account Manager', 'API Access', 
          'CSV Export', 'Excel Export', 'CRM Automation'
        ]
      : eliteFeatures;
  }
  
  if (isYearly) {
    features.push('Complete Database Access (Industry/Sub Niche)');
    features.push('No Lead Cap');
  }
  
  return [...new Set(features)];
}

export function calculateExtraLeadCost(extraLeads: number): number {
  return extraLeads * 99;
}
