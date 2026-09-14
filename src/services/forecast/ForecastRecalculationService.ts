import { supabase } from "@/integrations/supabase/client";
import { ForecastEngine } from "./ForecastEngine";
import { CloseTimingEngine } from "./CloseTimingEngine";
import { ForecastRiskEngine } from "./ForecastRiskEngine";
import { ForecastDriverEngine } from "./ForecastDriverEngine";
import { ForecastHistoryEngine } from "./ForecastHistoryEngine";

export class ForecastRecalculationService {
  /**
   * Orchestrates the recalculation of the entire forecast framework for an opportunity.
   */
  static async triggerRecalculation(opportunityId: string) {
    const { data: forecastProfile } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (!forecastProfile) return;

    const forecastId = forecastProfile.id;

    // 1. Evaluate Timing
    const { delayRisk, confidenceBand } = await CloseTimingEngine.evaluateTiming(opportunityId);
    await supabase
      .from('close_timing_profiles')
      .update({ confidence_band: confidenceBand, timing_status: delayRisk })
      .eq('opportunity_id', opportunityId);

    // 2. Evaluate Risks and Drivers
    await ForecastRiskEngine.evaluateRisks(forecastId, opportunityId);
    await ForecastDriverEngine.evaluateDrivers(forecastId, opportunityId);

    // 3. Calculate Core Forecast
    const { scenarios, confidence } = await ForecastEngine.calculateForecast(opportunityId);

    // 4. Update Profile
    const { data: updatedProfile, error } = await supabase
      .from('revenue_forecasts')
      .update({
        commit_case: scenarios.commit_case,
        expected_case: scenarios.expected_case,
        best_case: scenarios.best_case,
        worst_case: scenarios.worst_case,
        pipeline_case: scenarios.pipeline_case,
        forecast_confidence: confidence,
        forecast_status: 'CALCULATED',
        updated_at: new Date().toISOString()
      })
      .eq('id', forecastId)
      .select()
      .single();

    if (error) throw error;

    // 5. Snapshot History
    await ForecastHistoryEngine.recordSnapshot(forecastId, updatedProfile);

    return updatedProfile;
  }
}
