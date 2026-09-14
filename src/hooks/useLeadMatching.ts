import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from './useBusinessProfile';

/**
 * Core lead matching engine.
 * Returns leads that are relevant to the user's business profile.
 */
export function useMatchedLeads(options?: { limit?: number; source?: 'marketplace' | 'crm' }) {
  const { profile } = useAuth() as any;
  const { data: businessProfile } = useBusinessProfile();
  const limit = options?.limit ?? 200;

  return useQuery({
    queryKey: ['matched-leads', profile?.id, businessProfile?.industry_id, limit],
    queryFn: async () => {
      if (!profile?.id) return [];

      const currentPlan = profile?.subscription_plan || 'free';
      const isPremium = ['premium', 'elite'].includes(currentPlan);

      // Build base query for marketplace leads
      let query = (supabase as any)
        .from('leads')
        .select('id, title, location, category, budget_min, budget_max, description, project_type, created_at, status, industry_id, subcategory_id, relevance_tags, target_audience, company_size, lead_source')
        .in('verification_status', ['VERIFIED', 'verified'])
        .eq('status', 'active')
        .neq('seller_id', profile.id)
        .order('created_at', { ascending: false });

      // If user has a business profile, prioritize matching leads
      if (businessProfile?.industry_id) {
        // First, get leads matching user's industry
        const { data: industryLeads, error: iErr } = await (supabase as any)
          .from('leads')
          .select('id, title, location, category, budget_min, budget_max, description, project_type, created_at, status, industry_id, subcategory_id, relevance_tags, target_audience, company_size, lead_source')
          .in('verification_status', ['VERIFIED', 'verified'])
          .eq('status', 'active')
          .neq('seller_id', profile.id)
          .eq('industry_id', businessProfile.industry_id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (iErr) throw iErr;

        // If we have enough industry-matched leads, return them
        // Otherwise supplement with other leads
        if ((industryLeads || []).length >= limit) {
          return scoreLeads(industryLeads || [], businessProfile);
        }

        // Get remaining leads from other industries to fill quota
        const matchedIds = (industryLeads || []).map((l: any) => l.id);
        const remaining = limit - (industryLeads || []).length;

        let supplementQuery = (supabase as any)
          .from('leads')
          .select('id, title, location, category, budget_min, budget_max, description, project_type, created_at, status, industry_id, subcategory_id, relevance_tags, target_audience, company_size, lead_source')
          .in('verification_status', ['VERIFIED', 'verified'])
          .eq('status', 'active')
          .neq('seller_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(remaining);

        if (businessProfile.industry_id) {
          supplementQuery = supplementQuery.neq('industry_id', businessProfile.industry_id);
        }

        const { data: otherLeads } = await supplementQuery;

        const allLeads = [...(industryLeads || []), ...(otherLeads || [])];
        return scoreLeads(allLeads, businessProfile);
      }

      // No business profile: return all leads (unscored)
      query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((lead: any) => ({ ...lead, matchScore: 0, matchReasons: [] as string[] }));
    },
    enabled: !!profile?.id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Score leads based on relevance to user's business profile
 */
function scoreLeads(leads: any[], bp: any) {
  return leads.map(lead => {
    let score = 0;
    const reasons: string[] = [];

    // Industry match: +40 points
    if (lead.industry_id && lead.industry_id === bp.industry_id) {
      score += 40;
      reasons.push('Same industry');
    }

    // Subcategory match: +25 points
    if (lead.subcategory_id && lead.subcategory_id === bp.subcategory_id) {
      score += 25;
      reasons.push('Same subcategory');
    }

    // Tag overlap: up to +15 points
    if (lead.relevance_tags && bp.ideal_lead_types) {
      const leadTags = (lead.relevance_tags || []).map((t: string) => t.toLowerCase());
      const userPrefs = (bp.ideal_lead_types || []).map((t: string) => t.toLowerCase());
      const overlap = leadTags.filter((t: string) => userPrefs.some((p: string) => t.includes(p) || p.includes(t)));
      score += Math.min(overlap.length * 5, 15);
      if (overlap.length > 0) reasons.push(`${overlap.length} tag match(es)`);
    }

    // Geography match: +10 points
    if (lead.location && bp.target_geography) {
      const loc = lead.location.toLowerCase();
      const geoMatch = (bp.target_geography || []).some((g: string) => loc.includes(g.toLowerCase()));
      if (geoMatch) {
        score += 10;
        reasons.push('Geography match');
      }
    }

    // Audience match: +10 points
    if (lead.target_audience && bp.target_audience) {
      const audienceMatch = (bp.target_audience || []).some(
        (a: string) => lead.target_audience?.toLowerCase().includes(a.toLowerCase())
      );
      if (audienceMatch) {
        score += 10;
        reasons.push('Audience match');
      }
    }

    return { ...lead, matchScore: Math.min(score, 100), matchReasons: reasons };
  }).sort((a: any, b: any) => b.matchScore - a.matchScore);
}

/**
 * Get CRM leads filtered by user's business profile
 */
export function useMatchedCrmLeads() {
  const { profile } = useAuth() as any;
  const { data: businessProfile } = useBusinessProfile();

  return useQuery({
    queryKey: ['matched-crm-leads', profile?.id, businessProfile?.industry_id],
    queryFn: async () => {
      if (!profile?.id) return { verified: [], auto: [] };

      const { data: leads, error } = await (supabase as any)
        .from('crm_leads')
        .select('*')
        .eq('assigned_to', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const verified = (leads || []).filter((l: any) => l.source_type === 'verified');
      const auto = (leads || []).filter((l: any) => l.source_type === 'auto');

      return { verified, auto };
    },
    enabled: !!profile?.id,
  });
}
