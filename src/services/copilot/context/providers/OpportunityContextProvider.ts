import { supabase } from "@/integrations/supabase/client";

export class OpportunityContextProvider {
  /**
   * Fetches baseline opportunity data and returns it in a highly compressed format for LLM context.
   */
  static async getContext(opportunityId: string) {
    const { data: opp } = await supabase
      .from('opportunities')
      .select('id, name, amount, stage, current_revenue_forecast, probability_score, target_close_date')
      .eq('id', opportunityId)
      .single();

    if (!opp) return null;

    return {
      type: "OPPORTUNITY_BASELINE",
      source_system: "opportunities",
      source_id: opp.id,
      data: {
        Name: opp.name,
        Stage: opp.stage,
        Forecast: `$${opp.current_revenue_forecast}`,
        Probability: `${opp.probability_score}%`,
        TargetClose: opp.target_close_date
      }
    };
  }
}
