import { PipelineHealthContextEngine } from "./PipelineHealthContextEngine";
import { ForecastContextEngine } from "./ForecastContextEngine";
import { RevenueContextEngine } from "./RevenueContextEngine";

export class PortfolioContextBuilder {
  /**
   * Combines Pipeline Health, Forecast, and Revenue aggregations into a single payload.
   */
  static async buildContext(portfolioScope: string) {
    const pipeline = await PipelineHealthContextEngine.aggregateHealth(portfolioScope);
    const forecast = await ForecastContextEngine.aggregateForecast(portfolioScope);
    const revenue = await RevenueContextEngine.aggregateRevenue(portfolioScope);

    return {
      scope: portfolioScope,
      pipeline,
      forecast,
      revenue,
      timestamp: new Date().toISOString()
    };
  }
}
