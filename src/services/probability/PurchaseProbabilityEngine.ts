import { supabase } from "@/integrations/supabase/client";

export class PurchaseProbabilityEngine {
  /**
   * Calculates Win Probability based on Opportunity, Decision, and Stakeholder Intelligence.
   * This is a purely rule-based calculation (No ML).
   */
  static async calculateProbability(opportunityId: string): Promise<number> {
    // 1. Fetch Opportunity Base Score
    const { data: oppScore } = await supabase
      .from('master_opportunity_scores')
      .select('overall_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    // 2. Fetch Decision Profile (Readiness/Risk/Momentum)
    const { data: decProfile } = await supabase
      .from('decision_profiles')
      .select('decision_readiness_score, decision_risk_score, decision_momentum_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    // 3. Fetch Committee Health
    const { data: committee } = await supabase
      .from('committee_intelligence')
      .select('health_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    // Base calculation: Starts at 20 (base), up to 100 max.
    // Weights: Opportunity Quality (40%), Decision Quality (30%), Stakeholder/Committee Quality (30%)
    
    let baseScore = oppScore?.overall_score ?? 0;
    
    // Normalize Decision Score
    let decisionScore = 0;
    if (decProfile) {
      const readiness = decProfile.decision_readiness_score ?? 0;
      const momentum = decProfile.decision_momentum_score ?? 0;
      const risk = decProfile.decision_risk_score ?? 0;
      // Readiness and Momentum are positive, Risk is negative
      decisionScore = Math.max(0, ((readiness * 0.6) + (momentum * 0.4)) - (risk * 0.5));
    }

    // Normalize Stakeholder Score
    let stakeholderScore = committee?.health_score ?? 0;

    // Weighted Formula
    let probability = (baseScore * 0.4) + (decisionScore * 0.3) + (stakeholderScore * 0.3);

    // Hard Caps for Blockers
    // Check if there are active blockers in probability_drivers
    const { count: blockerCount } = await supabase
      .from('probability_drivers')
      .select('*', { count: 'exact', head: true })
      .eq('opportunity_id', opportunityId)
      .eq('driver_type', 'BLOCKER')
      .eq('status', 'ACTIVE');

    if (blockerCount && blockerCount > 0) {
      // If critical blockers exist, cap probability at 20%
      probability = Math.min(probability, 20);
    }

    return Math.round(Math.max(0, Math.min(100, probability)));
  }
}
