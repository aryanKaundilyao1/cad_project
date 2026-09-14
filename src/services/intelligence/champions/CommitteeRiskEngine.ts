export class CommitteeRiskEngine {
  /**
   * Evaluates group-level vulnerabilities for the buying committee.
   */
  static evaluate(
    confirmedChampions: number, 
    confirmedBlockers: number, 
    decisionMakerReachable: boolean
  ): string[] {
    const risks: string[] = [];

    if (confirmedChampions === 0) {
      risks.push('Missing Champions: No confirmed champions have been identified for this deal.');
    }

    if (!decisionMakerReachable) {
      risks.push('Unreachable Decision Maker: The primary budget holder is completely isolated from our network.');
    }

    if (confirmedBlockers > 0) {
      risks.push(`Strong Blockers: ${confirmedBlockers} active blockers are opposing this deal.`);
    }

    return risks;
  }
}
