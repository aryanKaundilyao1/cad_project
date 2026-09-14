import { supabase } from "@/integrations/supabase/client";
import { ExecutiveRevenueInsightEngine } from "./ExecutiveRevenueInsightEngine";
import { ExecutiveNarrativeEngine } from "./ExecutiveNarrativeEngine";

export class ForecastReviewEngine {
  /**
   * Generates deep-dive static analysis documents for the forecast commit breakdown.
   */
  static async generateReview(portfolioScope: string, portfolioContext: any, period: string) {
    const insights = ExecutiveRevenueInsightEngine.generateInsights(portfolioContext);
    const narrative = ExecutiveNarrativeEngine.buildNarrative(insights, 'FORECAST_REVIEW');

    const { data: review, error } = await supabase.from('forecast_reviews').insert({
      portfolio_scope: portfolioScope,
      review_period: period,
      content: narrative,
      context_package_id: portfolioContext.id
    }).select('id').single();

    if (error || !review) throw new Error("Failed to generate Forecast Review");

    return review.id;
  }
}
