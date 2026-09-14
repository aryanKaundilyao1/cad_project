import { supabase } from "@/integrations/supabase/client";

export class ScoreUIQueryService {
  /**
   * Fetches the dashboard intelligence summary:
   * Averages, Top Opportunities, At-Risk Opportunities, Fastest Rising.
   */
  static async getDashboardIntelligenceSummary() {
    // In a real production app with massive data, this should call an RPC or rely on a materialized view.
    // For Phase 3D, we pull from the view.
    const { data: opportunities, error } = await supabase
      .from('vw_opportunity_intelligence')
      .select('*')
      .not('master_score', 'is', null);

    if (error || !opportunities) {
      return null;
    }

    let totalFit = 0, totalIntent = 0, totalTiming = 0, totalEngagement = 0;
    const validOpps = opportunities.filter(o => o.master_score !== null);
    
    validOpps.forEach(o => {
      totalFit += (o.fit_score || 0);
      totalIntent += (o.intent_score || 0);
      totalTiming += (o.timing_score || 0);
      totalEngagement += (o.engagement_score || 0);
    });

    const count = validOpps.length || 1;

    // Top Opportunities
    const topOpps = [...validOpps].sort((a, b) => b.master_score - a.master_score).slice(0, 5);

    // At Risk (Delta < -10)
    const atRisk = [...validOpps].filter(o => o.current_delta !== null && o.current_delta <= -10).sort((a, b) => (a.current_delta || 0) - (b.current_delta || 0));

    // Fastest Rising (Delta > 10)
    const fastestRising = [...validOpps].filter(o => o.current_delta !== null && o.current_delta >= 10).sort((a, b) => (b.current_delta || 0) - (a.current_delta || 0));

    return {
      averages: {
        fit: Math.round(totalFit / count),
        intent: Math.round(totalIntent / count),
        timing: Math.round(totalTiming / count),
        engagement: Math.round(totalEngagement / count)
      },
      topOpps,
      atRisk,
      fastestRising
    };
  }

  /**
   * Fetches the specific explainability block for a given opportunity without fetching heavy historical arrays.
   */
  static async getScoreExplainability(opportunityId: string) {
    const { data, error } = await supabase
      .from('opportunity_scores')
      .select('master_score, factors, weights, evidence, confidence')
      .eq('opportunity_id', opportunityId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Fetches historical data formatted for Recharts.
   */
  static async getHistoricalChartData(opportunityId: string) {
    const { data, error } = await supabase
      .from('opportunity_score_history')
      .select('master_score, fit_score, intent_score, timing_score, engagement_score, snapshot_date')
      .eq('opportunity_id', opportunityId)
      .order('snapshot_date', { ascending: true });

    if (error) throw error;

    return data.map(row => ({
      date: new Date(row.snapshot_date).toLocaleDateString(),
      Master: row.master_score,
      Fit: row.fit_score,
      Intent: row.intent_score,
      Timing: row.timing_score,
      Engagement: row.engagement_score
    }));
  }
}
