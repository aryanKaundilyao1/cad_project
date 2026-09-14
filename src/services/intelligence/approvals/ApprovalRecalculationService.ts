import { supabase } from "@/integrations/supabase/client";
import { ApprovalPathEngine } from "./ApprovalPathEngine";
import { ApprovalDependencyEngine } from "./ApprovalDependencyEngine";
import { ApprovalCoverageEngine } from "./ApprovalCoverageEngine";
import { ApprovalRiskEngine } from "./ApprovalRiskEngine";
import { ApprovalReadinessEngine } from "./ApprovalReadinessEngine";
import { ApprovalBottleneckEngine } from "./ApprovalBottleneckEngine";
import { ApprovalExplanationService } from "./ApprovalExplanationService";

export class ApprovalRecalculationService {
  /**
   * Orchestrates the 6C engines and persists the result to the append-only ledger.
   */
  static async recalculate(approvalChainId: string) {
    // 1. Fetch underlying data (Mocked for architecture blueprint)
    const steps: any[] = [];
    const members: any[] = [];
    const stakeholderIntelligence = new Map<string, any>();
    const isParallel = false;
    const decisionReadiness = 75;

    // 2. Run Engines
    const path = ApprovalPathEngine.calculatePath(steps, isParallel);
    const dependency = ApprovalDependencyEngine.evaluate(steps, members);
    const coverage = ApprovalCoverageEngine.evaluate(members, stakeholderIntelligence);
    const risk = ApprovalRiskEngine.evaluate(members, stakeholderIntelligence);
    const readiness = ApprovalReadinessEngine.evaluate(members, decisionReadiness);
    const bottleneck = ApprovalBottleneckEngine.evaluate(steps, members, isParallel);

    // 3. Aggregate Evidence
    const totalEvidence = ApprovalExplanationService.formatEvidence(
      path.evidence,
      dependency.evidence,
      coverage.evidence,
      risk.evidence,
      readiness.evidence,
      bottleneck.evidence
    );

    // 4. Persist to Ledger
    const { data, error } = await supabase
      .from('approval_intelligence')
      .insert({
        approval_chain_id: approvalChainId,
        critical_path: path.critical_path,
        coverage_score: coverage.coverage_score,
        readiness_score: readiness.readiness_score,
        risk_score: risk.risk_score,
        bottleneck_step_id: bottleneck.bottleneck_step_id,
        evidence: totalEvidence
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to recalculate approval intelligence:", error);
      throw error;
    }

    return data;
  }
}
