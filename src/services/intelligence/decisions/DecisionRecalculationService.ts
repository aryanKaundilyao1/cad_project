import { supabase } from "@/integrations/supabase/client";
import { DecisionReadinessEngine } from "./DecisionReadinessEngine";
import { DecisionRiskEngine } from "./DecisionRiskEngine";
import { DecisionMomentumEngine } from "./DecisionMomentumEngine";
import { DecisionConfidenceEngine } from "./DecisionConfidenceEngine";
import { DecisionExplanationService } from "./DecisionExplanationService";

export class DecisionRecalculationService {
  /**
   * The master orchestrator for Phase 6B.
   * Runs all intelligence engines and persists the result to the append-only ledger.
   */
  static async recalculate(decisionProfileId: string) {
    // 1. Fetch all underlying data (mocked for blueprint)
    const milestones: any[] = [];
    const approvals: any[] = [];
    const hasConfirmedChampion = true;
    const hasEconomicBuyer = true;
    const approvalsAssignedToBlockers = 0;
    const overdueMilestones = 0;
    const isStalled = false;
    const daysSinceLastMilestone = 5;
    const daysSinceCreation = 10;
    const signalsCount = 15;
    const committeeCoveragePercent = 90;

    // 2. Run Engines
    const readiness = DecisionReadinessEngine.evaluate(milestones, approvals, hasConfirmedChampion, hasEconomicBuyer);
    const risk = DecisionRiskEngine.evaluate(approvalsAssignedToBlockers, overdueMilestones, isStalled);
    const momentum = DecisionMomentumEngine.evaluate(daysSinceLastMilestone, daysSinceCreation);
    const confidence = DecisionConfidenceEngine.evaluate(signalsCount, committeeCoveragePercent);

    // 3. Aggregate Evidence
    const totalEvidence = DecisionExplanationService.formatEvidence(
      readiness.evidence,
      risk.evidence,
      momentum.evidence,
      confidence.evidence
    );

    // 4. Persist to Ledger
    const { data, error } = await supabase
      .from('decision_scores')
      .insert({
        decision_profile_id: decisionProfileId,
        readiness_score: readiness.score,
        risk_score: risk.score,
        risk_severity: risk.severity,
        momentum_state: momentum.state,
        confidence_score: confidence.score,
        evidence: totalEvidence
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to recalculate decision intelligence:", error);
      throw error;
    }

    return data;
  }
}
