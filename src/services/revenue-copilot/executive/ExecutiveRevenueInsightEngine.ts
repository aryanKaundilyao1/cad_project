import { PortfolioInsightEngine } from "../conversation/PortfolioInsightEngine";

export class ExecutiveRevenueInsightEngine {
  /**
   * Translates raw context into top risks and opportunities without generating new data.
   */
  static generateInsights(portfolioContext: any) {
    const rawForecast = PortfolioInsightEngine.extractInsights(portfolioContext, 'FORECAST_ANALYSIS');
    
    return [
      {
        type: 'TOP_RISK',
        title: 'Forecast Confidence Decline',
        description: `Confidence score dropped to ${rawForecast.forecast_confidence_score} due to major risk vectors.`,
        source_context_id: portfolioContext.id
      }
    ];
  }
}
