import { supabase } from "@/integrations/supabase/client";

export class CloseTimingEngine {
  /**
   * Evaluates delay risks based on decision momentum.
   */
  static async evaluateTiming(opportunityId: string) {
    const { data: decProfile } = await supabase
      .from('decision_profiles')
      .select('decision_momentum_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    const momentum = decProfile?.decision_momentum_score ?? 0;
    
    let delayRisk = 'UNKNOWN';
    let confidenceBand = 'UNKNOWN';

    if (momentum > 80) {
      delayRisk = 'LOW';
      confidenceBand = 'NARROW'; // highly predictable
    } else if (momentum > 40) {
      delayRisk = 'MEDIUM';
      confidenceBand = 'WIDE'; // moderately predictable
    } else {
      delayRisk = 'HIGH';
      confidenceBand = 'WIDE'; // unpredictable
    }

    return {
      delayRisk,
      confidenceBand
    };
  }
}
