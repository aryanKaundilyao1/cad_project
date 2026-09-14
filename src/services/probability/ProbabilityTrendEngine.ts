import { supabase } from "@/integrations/supabase/client";

export class ProbabilityTrendEngine {
  /**
   * Determines the trend of the probability compared to its most recent snapshot.
   */
  static async evaluateTrend(profileId: string, currentProbability: number): Promise<{ trend: string, velocity: number }> {
    // Fetch the most recent history event for this profile that changed probability
    const { data: history } = await supabase
      .from('purchase_probability_history')
      .select('*')
      .eq('profile_id', profileId)
      .eq('event_type', 'PROBABILITY_RECALCULATED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!history || !history.previous_state) {
      return { trend: 'STABLE', velocity: 0 };
    }

    const previousProbability = history.previous_state?.win_probability ?? currentProbability;
    const difference = currentProbability - previousProbability;

    let trend = 'STABLE';
    if (difference >= 2) trend = 'UP';
    else if (difference <= -2) trend = 'DOWN';

    return { trend, velocity: difference };
  }
}
