export class ApprovalCoverageEngine {
  /**
   * Measures our relationship access to the required approvers.
   */
  static evaluate(
    members: any[],
    stakeholderIntelligence: Map<string, any> // Stakeholder ID -> Intelligence Data
  ): { coverage_score: number, evidence: string[] } {
    let score = 0;
    const evidence: string[] = [];
    
    if (members.length === 0) return { coverage_score: 0, evidence: ["No approvers to cover."] };

    let coveredCount = 0;
    for (const member of members) {
      const intel = stakeholderIntelligence.get(member.stakeholder_id);
      if (intel && (intel.engagement_score > 0 || intel.influence_score > 0)) {
        coveredCount++;
      }
    }

    const ratio = coveredCount / members.length;
    score = Math.round(ratio * 100);

    evidence.push(`Approval Coverage: We have active engagement with ${coveredCount} out of ${members.length} known approvers.`);
    
    if (score < 50) {
      evidence.push(`Coverage Gap: Significant portion of the approval chain is inaccessible.`);
    }

    return { coverage_score: score, evidence };
  }
}
