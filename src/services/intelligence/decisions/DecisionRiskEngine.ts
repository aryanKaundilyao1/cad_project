export class DecisionRiskEngine {
  /**
   * Identifies structural and timeline risks preventing approval.
   */
  static evaluate(
    approvalsAssignedToBlockers: number,
    overdueMilestones: number,
    isStalled: boolean
  ): { score: number, severity: string, evidence: string[] } {
    let score = 0;
    const evidence: string[] = [];

    if (approvalsAssignedToBlockers > 0) {
      score += 40;
      evidence.push(`CRITICAL RISK: ${approvalsAssignedToBlockers} pending approval(s) are assigned to confirmed blockers.`);
    }

    if (overdueMilestones > 0) {
      score += (10 * overdueMilestones);
      evidence.push(`Timeline Risk: ${overdueMilestones} milestone(s) are overdue.`);
    }

    if (isStalled) {
      score += 20;
      evidence.push(`Momentum Risk: The decision process has stagnated.`);
    }

    score = Math.min(score, 100);

    let severity = 'LOW';
    if (score >= 75) severity = 'CRITICAL';
    else if (score >= 50) severity = 'HIGH';
    else if (score >= 25) severity = 'MEDIUM';

    return { score, severity, evidence };
  }
}
