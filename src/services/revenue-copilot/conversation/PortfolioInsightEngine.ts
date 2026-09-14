export class PortfolioInsightEngine {
  /**
   * Translates the raw Portfolio Context Package into actionable insights.
   */
  static extractInsights(contextPayload: any, intent: string) {
    // If intent is FORECAST_ANALYSIS, it pulls only forecast vectors.
    if (intent === 'FORECAST_ANALYSIS') return contextPayload.forecast;
    if (intent === 'PIPELINE_HEALTH') return contextPayload.pipeline;
    return contextPayload;
  }
}
