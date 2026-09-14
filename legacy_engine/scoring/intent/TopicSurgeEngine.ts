export class TopicSurgeEngine {
  /**
   * TopicSurgeComponent = 10 * min(1, surging_topic_count / 3) * avg(surge_scores>=60)/100
   * Max 10 points.
   */
  static evaluate(surgingTopicCount: number, surgeScores: any[]): number {
    if (!surgingTopicCount || surgingTopicCount === 0 || !surgeScores || surgeScores.length === 0) return 0;

    const relevantScores = surgeScores.filter(s => s.score >= 60).map(s => s.score);
    if (relevantScores.length === 0) return 0;

    const avgScore = relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
    
    const countMultiplier = Math.min(1, surgingTopicCount / 3);
    const scoreMultiplier = avgScore / 100;

    const raw = 10 * countMultiplier * scoreMultiplier;
    
    // Round to 2 decimal places
    return Math.round(raw * 100) / 100;
  }
}
