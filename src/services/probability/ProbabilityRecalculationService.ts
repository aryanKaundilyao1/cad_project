import { PurchaseProbabilityProfileService } from "./PurchaseProbabilityProfileService";
import { PurchaseProbabilityEngine } from "./PurchaseProbabilityEngine";
import { ProbabilityConfidenceEngine } from "./ProbabilityConfidenceEngine";
import { ProbabilityTrendEngine } from "./ProbabilityTrendEngine";
import { ProbabilityDriverEngine } from "./ProbabilityDriverEngine";
import { ProbabilityHistoryService } from "./ProbabilityHistoryService";

export class ProbabilityRecalculationService {
  /**
   * Orchestrates the recalculation of the entire probability framework for an opportunity.
   * Typically triggered asynchronously when underlying intelligence data changes.
   */
  static async triggerRecalculation(opportunityId: string) {
    // 1. Fetch current profile
    const profile = await PurchaseProbabilityProfileService.getProfileByOpportunity(opportunityId);
    if (!profile) return; // Ignore if profile doesn't exist yet

    const previousState = {
      win_probability: profile.win_probability,
      confidence_score: profile.confidence_score,
      trend_status: profile.trend_status
    };

    // 2. Re-evaluate Drivers first (since blockers cap probability)
    await ProbabilityDriverEngine.evaluateDrivers(profile.id, opportunityId);

    // 3. Calculate new metrics
    const newProbability = await PurchaseProbabilityEngine.calculateProbability(opportunityId);
    const newConfidence = await ProbabilityConfidenceEngine.calculateConfidence(opportunityId);
    const { trend: newTrend } = await ProbabilityTrendEngine.evaluateTrend(profile.id, newProbability);

    // 4. Update the profile
    const updatedProfile = await PurchaseProbabilityProfileService.updateProfileStatus(opportunityId, {
      probability_status: 'CALCULATED',
      trend_status: newTrend,
    });
    
    // Note: The previous service method updateProfileStatus only took a limited set of keys. 
    // We should update it or use direct supabase call here to set the actual numeric scores.
    // Let's do it directly for completeness in this orchestration:
    const { supabase } = await import("@/integrations/supabase/client");
    
    const { data: finalProfile, error } = await supabase
      .from('purchase_probability_profiles')
      .update({
        win_probability: newProbability,
        confidence_score: newConfidence,
        trend_status: newTrend,
        probability_status: 'CALCULATED',
        last_calculated_at: new Date().toISOString()
      })
      .eq('opportunity_id', opportunityId)
      .select()
      .single();

    if (error) throw error;

    // 5. Log History Snapshot if significant change (e.g. any change here for tracking)
    await ProbabilityHistoryService.logEvent(
      profile.id, 
      'PROBABILITY_RECALCULATED', 
      previousState, 
      {
        win_probability: newProbability,
        confidence_score: newConfidence,
        trend_status: newTrend
      }
    );

    return finalProfile;
  }
}
