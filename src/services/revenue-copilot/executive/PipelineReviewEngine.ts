import { supabase } from "@/integrations/supabase/client";
import { ExecutiveRevenueInsightEngine } from "./ExecutiveRevenueInsightEngine";
import { ExecutiveNarrativeEngine } from "./ExecutiveNarrativeEngine";

export class PipelineReviewEngine {
  /**
   * Generates pipeline health and coverage analysis documents.
   */
  static async generateReview(portfolioScope: string, portfolioContext: any) {
    const insights = ExecutiveRevenueInsightEngine.generateInsights(portfolioContext);
    const narrative = ExecutiveNarrativeEngine.buildNarrative(insights, 'PIPELINE_REVIEW');

    const { data: review, error } = await supabase.from('pipeline_reviews').insert({
      portfolio_scope: portfolioScope,
      content: narrative,
      context_package_id: portfolioContext.id
    }).select('id').single();

    if (error || !review) throw new Error("Failed to generate Pipeline Review");

    return review.id;
  }
}
