import { supabase } from "@/integrations/supabase/client";
import { ExecutiveRevenueInsightEngine } from "./ExecutiveRevenueInsightEngine";
import { ExecutiveNarrativeEngine } from "./ExecutiveNarrativeEngine";

export class BoardReviewEngine {
  /**
   * Generates ultra-compressed, highly-cited final output meant for external/board consumption.
   */
  static async generateReview(portfolioScope: string, portfolioContext: any, quarter: string) {
    // A Board Review uses a more compressed/high-level insight extraction
    const insights = ExecutiveRevenueInsightEngine.generateInsights(portfolioContext);
    const narrative = ExecutiveNarrativeEngine.buildNarrative(insights, 'BOARD_REVIEW');

    const { data: review, error } = await supabase.from('board_reviews').insert({
      portfolio_scope: portfolioScope,
      review_quarter: quarter,
      content: narrative,
      context_package_id: portfolioContext.id
    }).select('id').single();

    if (error || !review) throw new Error("Failed to generate Board Review");

    return review.id;
  }
}
