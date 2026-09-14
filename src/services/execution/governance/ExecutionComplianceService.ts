import { ExecutionPolicyEngine } from "./ExecutionPolicyEngine";
import { ExecutionRiskEngine } from "./ExecutionRiskEngine";

export class ExecutionComplianceService {
  /**
   * Coordinates Policy checks and Risk assessments for execution proposals.
   */
  static async validateCompliance(proposalId: string, payload: any) {
    const isCompliant = await ExecutionPolicyEngine.evaluateProposal(proposalId, payload);
    const riskAssessment = await ExecutionRiskEngine.evaluateRisk(proposalId, payload);
    
    return {
      isCompliant,
      riskLevel: riskAssessment.riskLevel
    };
  }
}
