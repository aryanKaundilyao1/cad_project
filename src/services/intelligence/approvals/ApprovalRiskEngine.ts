export class ApprovalRiskEngine {
  /**
   * Identifies threats to the approval process (e.g. blockers holding approval authority).
   */
  static evaluate(
    members: any[],
    stakeholderIntelligence: Map<string, any>
  ): { risk_score: number, severity: string, evidence: string[] } {
    let score = 0;
    const evidence: string[] = [];

    let blockerCount = 0;
    let missingInfoCount = 0;

    for (const member of members) {
      if (member.status === 'APPROVED') continue; // Past risk
      
      const intel = stakeholderIntelligence.get(member.stakeholder_id);
      if (!intel) {
        missingInfoCount++;
        continue;
      }

      if (intel.blocker_status === 'ACTIVE_BLOCKER') {
        blockerCount++;
        score += 40;
        evidence.push(`CRITICAL RISK: A pending approval is assigned to a known ACTIVE_BLOCKER.`);
      } else if (intel.sentiment_score < 0) {
        score += 20;
        evidence.push(`Stakeholder Risk: Approver has negative sentiment.`);
      }
    }

    if (missingInfoCount > 0) {
       score += (10 * missingInfoCount);
       evidence.push(`Coverage Risk: ${missingInfoCount} approver(s) have unknown sentiment.`);
    }

    score = Math.min(score, 100);

    let severity = 'LOW';
    if (score >= 75) severity = 'CRITICAL';
    else if (score >= 50) severity = 'HIGH';
    else if (score >= 25) severity = 'MEDIUM';

    return { risk_score: score, severity, evidence };
  }
}
