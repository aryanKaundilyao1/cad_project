export class DecisionConfidenceEngine {
  /**
   * Measures the trustworthiness of the intelligence.
   */
  static evaluate(
    signalsCount: number,
    committeeCoveragePercent: number
  ): { score: number, evidence: string[] } {
    let score = 20;
    const evidence: string[] = [];

    if (signalsCount > 10) {
      score += 40;
      evidence.push(`High signal density (${signalsCount} signals).`);
    } else {
      evidence.push(`Low signal density. Assessments may be based on stale or thin data.`);
    }

    if (committeeCoveragePercent > 80) {
      score += 40;
      evidence.push(`High committee visibility (${committeeCoveragePercent}% known).`);
    } else {
      evidence.push(`Blindspots: Only ${committeeCoveragePercent}% of the committee is mapped.`);
    }

    return { score, evidence };
  }
}
