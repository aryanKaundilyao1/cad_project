import { supabase } from "@/integrations/supabase/client";

export class ForecastConfidenceEngine {
  /**
   * Calculates the confidence score of the forecast (0-100).
   */
  static async calculateConfidence(opportunityId: string): Promise<number> {
    // 1. Fetch Probability Confidence
    const { data: probProfile } = await supabase
      .from('purchase_probability_profiles')
      .select('confidence_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    const probConfidence = probProfile?.confidence_score ?? 0;

    // 2. Fetch Timing Confidence
    const { data: timingProfile } = await supabase
      .from('close_timing_profiles')
      .select('confidence_band')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    let timingMultiplier = 1.0;
    if (timingProfile?.confidence_band === 'WIDE') timingMultiplier = 0.8;
    if (timingProfile?.confidence_band === 'UNKNOWN' || !timingProfile) timingMultiplier = 0.5;

    // Blend them
    return Math.round(probConfidence * timingMultiplier);
  }
}
