import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from './useBusinessProfile';

/**
 * Lead recommendation engine.
 * Analyzes user activity and returns recommended leads.
 */
export function useRecommendations(limit: number = 10) {
  const { profile } = useAuth() as any;
  const { data: businessProfile } = useBusinessProfile();

  return useQuery({
    queryKey: ['recommendations', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) return [];

      // 1. Fetch recent user activity
      const { data: activity } = await (supabase as any)
        .from('user_activity_log')
        .select('action_type, metadata')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // 2. Analyze patterns
      const industryFreq: Record<string, number> = {};
      const searchTerms: string[] = [];
      const viewedLeadIds: string[] = [];

      for (const act of (activity || [])) {
        if (act.metadata?.industry_id) {
          industryFreq[act.metadata.industry_id] = (industryFreq[act.metadata.industry_id] || 0) + 1;
        }
        if (act.action_type === 'search' && act.metadata?.query) {
          searchTerms.push(act.metadata.query);
        }
        if (act.action_type === 'view_lead' && act.metadata?.lead_id) {
          viewedLeadIds.push(act.metadata.lead_id);
        }
      }

      // 3. Get top interacted industry (beyond their primary)
      const sortedIndustries = Object.entries(industryFreq)
        .sort(([, a], [, b]) => b - a)
        .map(([id]) => id);

      // 4. Build recommendation query
      let query = (supabase as any)
        .from('leads')
        .select('id, title, location, category, budget_min, budget_max, description, industry_id, created_at, status')
        .in('verification_status', ['VERIFIED', 'verified'])
        .eq('status', 'active')
        .neq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Prioritize user's primary industry
      if (businessProfile?.industry_id) {
        query = query.eq('industry_id', businessProfile.industry_id);
      } else if (sortedIndustries.length > 0) {
        query = query.eq('industry_id', sortedIndustries[0]);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      // 5. Score and annotate with reasoning
      const scored = (leads || []).map((lead: any) => {
        let reason = 'Based on your industry';

        if (viewedLeadIds.length > 5) {
          reason = 'Based on your browsing patterns';
        }
        if (searchTerms.length > 3) {
          reason = 'Based on your recent searches';
        }

        return { ...lead, recommendationReason: reason };
      });

      return scored;
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Log a user activity event for the recommendation engine
 */
export async function logActivity(
  userId: string,
  actionType: string,
  metadata: Record<string, any> = {}
) {
  try {
    await (supabase as any).from('user_activity_log').insert({
      user_id: userId,
      action_type: actionType,
      metadata,
    });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}
