export class DecisionReadinessEngine {
  /**
   * Calculates how prepared the opportunity is for successful decision completion.
   */
  static evaluate(
    milestones: any[],
    approvals: any[],
    hasConfirmedChampion: boolean,
    hasEconomicBuyer: boolean
  ): { score: number, evidence: string[] } {
    let score = 50; // Base score
    const evidence: string[] = [];

    // Milestone Completion
    const requiredMilestones = milestones.filter(m => m.required);
    if (requiredMilestones.length > 0) {
      const completed = requiredMilestones.filter(m => m.status === 'COMPLETED').length;
      const ratio = completed / requiredMilestones.length;
      score += (20 * ratio);
      evidence.push(`${completed} out of ${requiredMilestones.length} required milestones completed.`);
    } else {
      evidence.push(`No required milestones established.`);
    }

    // Approval Progress
    if (approvals.length > 0) {
      const granted = approvals.filter(a => a.status === 'APPROVED').length;
      const ratio = granted / approvals.length;
      score += (10 * ratio);
      evidence.push(`${granted} out of ${approvals.length} approvals granted.`);
    }

    // Committee Modifiers
    if (hasConfirmedChampion) {
      score += 10;
      evidence.push(`Strong support: Confirmed Champion is active on the deal.`);
    }
    
    if (!hasEconomicBuyer) {
      score -= 20;
      evidence.push(`Critical Gap: No Economic Buyer identified on the committee.`);
    }

    score = Math.min(Math.max(Math.round(score), 0), 100);

    return { score, evidence };
  }
}
