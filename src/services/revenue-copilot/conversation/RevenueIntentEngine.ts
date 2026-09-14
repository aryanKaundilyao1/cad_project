export class RevenueIntentEngine {
  /**
   * Determines the specific subset of the portfolio the user is asking about.
   * e.g. "Why is forecast confidence dropping?" -> FORECAST_RISK
   */
  static analyzeIntent(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('forecast')) return 'FORECAST_ANALYSIS';
    if (q.includes('pipeline') || q.includes('coverage')) return 'PIPELINE_HEALTH';
    if (q.includes('exposure') || q.includes('concentration')) return 'REVENUE_EXPOSURE';
    return 'GENERAL_PORTFOLIO';
  }
}
