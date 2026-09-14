import { supabase } from "@/integrations/supabase/client";
import { ForecastScenarioEngine } from "./ForecastScenarioEngine";
import { ForecastConfidenceEngine } from "./ForecastConfidenceEngine";

export class ForecastEngine {
  /**
   * Generates the overarching forecast numbers for an opportunity.
   */
  static async calculateForecast(opportunityId: string) {
    // 1. Fetch Opportunity Base Amount
    const { data: opp } = await supabase
      .from('opportunities')
      .select('amount')
      .eq('id', opportunityId)
      .maybeSingle();

    const baseAmount = opp?.amount ?? 0;

    // 2. Fetch Win Probability
    const { data: probProfile } = await supabase
      .from('purchase_probability_profiles')
      .select('win_probability')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    const winProbability = probProfile?.win_probability ?? 0;

    // 3. Calculate Confidence
    const confidence = await ForecastConfidenceEngine.calculateConfidence(opportunityId);

    // 4. Calculate Scenarios
    const scenarios = ForecastScenarioEngine.calculateScenarios(baseAmount, winProbability, confidence);

    return {
      scenarios,
      confidence
    };
  }
}
