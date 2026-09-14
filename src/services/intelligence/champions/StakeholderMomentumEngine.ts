export class StakeholderMomentumEngine {
  /**
   * Tracks the derivative of stakeholder support based on historical scores.
   * Requires historical snapshots from `stakeholder_scores` table.
   */
  static evaluate(currentScore: number, historicalScores: any[]): { state: string, evidence: string[] } {
    if (!historicalScores || historicalScores.length < 2) {
      return { state: 'UNKNOWN', evidence: ['Insufficient historical data to determine momentum.'] };
    }

    // In a full implementation, we'd compare 7-day average vs 30-day average.
    // For this blueprint execution, we'll do a simple recent trend check.
    const oldest = historicalScores[historicalScores.length - 1].engagement_score;
    const delta = currentScore - oldest;

    if (delta > 15) {
      return { state: 'GROWING', evidence: [`Engagement has surged by ${Math.round(delta)} points recently.`] };
    } else if (delta < -15) {
      return { state: 'DECLINING', evidence: [`Engagement has dropped by ${Math.round(Math.abs(delta))} points recently.`] };
    } else if (delta < -30) {
      return { state: 'ESCALATING_RESISTANCE', evidence: [`Severe drop in engagement detected (${Math.round(delta)} points).`] };
    }

    return { state: 'STABLE', evidence: ['Engagement levels have remained consistent.'] };
  }
}
