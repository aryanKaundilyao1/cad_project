import { supabase } from "@/integrations/supabase/client";

export class OutcomeAnalysisService {
  /**
   * Called when an opportunity is moved to Closed Won or Closed Lost.
   * Records the delta between our prediction and reality to train future ML models.
   */
  static async logOutcome(opportunityId: string, actualOutcome: 'WON' | 'LOST', actualRevenue: number, actualCloseDate: string) {
    
    const { data: probProfile } = await supabase.from('purchase_probability_profiles').select('win_probability').eq('opportunity_id', opportunityId).maybeSingle();
    const { data: forecast } = await supabase.from('revenue_forecasts').select('expected_case').eq('opportunity_id', opportunityId).maybeSingle();
    const { data: timing } = await supabase.from('close_timing_profiles').select('expected_window_end').eq('opportunity_id', opportunityId).maybeSingle();

    await supabase.from('outcome_analysis').insert({
      opportunity_id: opportunityId,
      predicted_probability: probProfile?.win_probability,
      actual_outcome: actualOutcome,
      predicted_expected_revenue: forecast?.expected_case,
      actual_revenue: actualRevenue,
      predicted_close_date: timing?.expected_window_end,
      actual_close_date: actualCloseDate
    });
  }
}
