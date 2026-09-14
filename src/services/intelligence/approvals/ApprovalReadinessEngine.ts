export class ApprovalReadinessEngine {
  /**
   * Determines how ready the approval chain is for successful completion.
   */
  static evaluate(
    members: any[],
    decisionReadiness: number
  ): { readiness_score: number, evidence: string[] } {
    const evidence: string[] = [];
    
    if (members.length === 0) return { readiness_score: 0, evidence: ["No approvers configured."] };

    const approvedCount = members.filter(m => m.status === 'APPROVED').length;
    const approvalRatio = approvedCount / members.length;
    
    // Weight the base decision readiness against the actual approval progress
    const baseScore = decisionReadiness * 0.4;
    const progressScore = (approvalRatio * 100) * 0.6;
    
    const score = Math.round(baseScore + progressScore);

    evidence.push(`Approval Readiness: ${approvedCount} out of ${members.length} approvals complete.`);
    evidence.push(`Factoring in overall decision readiness (${decisionReadiness}%).`);

    return { readiness_score: score, evidence };
  }
}
