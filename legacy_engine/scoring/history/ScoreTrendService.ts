import { supabase } from "@/integrations/supabase/client";

export interface ScoreTrend {
  currentScore: number;
  trend7Day: number;
  trend30Day: number;
  trend90Day: number;
}

export class ScoreTrendService {
  /**
   * Calculates the historical trends (7/30/90 days) for a given opportunity.
   * Compares the current score against the snapshot closest to the target date.
   */
  static async calculateTrends(opportunityId: string, currentScore: number, scoreType: 'master_score' | 'fit_score' | 'intent_score' | 'timing_score' | 'engagement_score'): Promise<ScoreTrend> {
    
    const now = new Date();
    
    // Helper function to fetch the closest score on or before a given date
    const getHistoricalScore = async (daysAgo: number): Promise<number | null> => {
      const targetDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('opportunity_score_history')
        .select(scoreType)
        .eq('opportunity_id', opportunityId)
        .lte('snapshot_date', targetDate.toISOString())
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
        
      if (error || !data) return null;
      
      // Dynamic property access based on scoreType
      return (data as any)[scoreType] as number;
    };

    const score7 = await getHistoricalScore(7);
    const score30 = await getHistoricalScore(30);
    const score90 = await getHistoricalScore(90);

    return {
      currentScore,
      trend7Day: score7 !== null ? Math.round((currentScore - score7) * 100) / 100 : 0,
      trend30Day: score30 !== null ? Math.round((currentScore - score30) * 100) / 100 : 0,
      trend90Day: score90 !== null ? Math.round((currentScore - score90) * 100) / 100 : 0
    };
  }
}
