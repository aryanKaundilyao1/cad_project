import { supabase } from "@/integrations/supabase/client";

export class ForecastRiskEngine {
  /**
   * Identifies risks that could negatively impact the forecast.
   */
  static async evaluateRisks(forecastId: string, opportunityId: string) {
    // Clear old active risks
    await supabase
      .from('forecast_risks')
      .update({ status: 'ARCHIVED' })
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    // 1. Check Decision Blockers
    const { data: decProfile } = await supabase
      .from('decision_profiles')
      .select('decision_risk_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (decProfile && (decProfile.decision_risk_score ?? 0) > 75) {
      await supabase
        .from('forecast_risks')
        .insert({
          forecast_id: forecastId,
          opportunity_id: opportunityId,
          risk_type: 'DECISION_BLOCKER',
          severity: 'HIGH',
          description: 'High decision risk threatens the commit forecast.'
        });
    }

    // 2. Check Timing Confidence
    const { data: timingProfile } = await supabase
      .from('close_timing_profiles')
      .select('confidence_band')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (timingProfile && timingProfile.confidence_band === 'WIDE') {
      await supabase
        .from('forecast_risks')
        .insert({
          forecast_id: forecastId,
          opportunity_id: opportunityId,
          risk_type: 'SLIPPAGE_RISK',
          severity: 'MEDIUM',
          description: 'Wide timing confidence indicates risk of slipping to next quarter.'
        });
    }
  }
}
