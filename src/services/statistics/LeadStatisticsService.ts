import { supabase } from '@/integrations/supabase/client';

export interface LeadStatistics {
  totalActiveLeads: number;
  newLeadsToday: number;
  scoredLeads: number;
  t1Leads: number;
  t2Leads: number;
  t3Leads: number;
  connectedLeads: number;
  wonLeads: number;
  lostLeads: number;
}

export class LeadStatisticsService {
  /**
   * Returns unified statistics for leads and opportunities across the platform.
   * This ensures the Dashboard, Index, and Tenders pages all display
   * exactly the same numbers.
   */
  static async getGlobalStatistics(): Promise<LeadStatistics> {
    try {
      // 1. Total Active Leads (from leads table)
      const { count: activeCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Planning', 'Active', 'Negotiation'])
        .eq('is_public', true);

      // 2. New Leads Today (from leads table)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newTodayCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .eq('is_public', true);

      // 3. OIE Scored Leads (from opportunities table)
      const { count: scoredCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .not('lead_score', 'is', null);

      // 4. ICP Tiers (from opportunities table)
      const [t1Req, t2Req, t3Req] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T1'),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T2'),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T3'),
      ]);

      // 5. Sales Statuses (from opportunities table)
      const [connectedReq, wonReq, lostReq] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('sales_status', 'Connected'),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('sales_status', 'Won'),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('sales_status', 'Lost'),
      ]);

      return {
        totalActiveLeads: activeCount || 0,
        newLeadsToday: newTodayCount || 0,
        scoredLeads: scoredCount || 0,
        t1Leads: t1Req.count || 0,
        t2Leads: t2Req.count || 0,
        t3Leads: t3Req.count || 0,
        connectedLeads: connectedReq.count || 0,
        wonLeads: wonReq.count || 0,
        lostLeads: lostReq.count || 0,
      };
    } catch (error) {
      console.error('Error fetching global lead statistics:', error);
      // Return safe fallback
      return {
        totalActiveLeads: 0,
        newLeadsToday: 0,
        scoredLeads: 0,
        t1Leads: 0,
        t2Leads: 0,
        t3Leads: 0,
        connectedLeads: 0,
        wonLeads: 0,
        lostLeads: 0,
      };
    }
  }
}
