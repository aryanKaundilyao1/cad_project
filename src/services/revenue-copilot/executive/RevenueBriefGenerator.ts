import { supabase } from "@/integrations/supabase/client";
import { ExecutiveRevenueInsightEngine } from "./ExecutiveRevenueInsightEngine";
import { ExecutiveNarrativeEngine } from "./ExecutiveNarrativeEngine";

export class RevenueBriefGenerator {
  /**
   * Generates the "Morning Report" brief detailing top revenue risks and changes.
   */
  static async generateBrief(portfolioScope: string, portfolioContext: any, briefType: 'DAILY' | 'WEEKLY') {
    const insights = ExecutiveRevenueInsightEngine.generateInsights(portfolioContext);
    const narrative = ExecutiveNarrativeEngine.buildNarrative(insights, 'BRIEF');

    const { data: brief, error } = await supabase.from('revenue_briefs').insert({
      portfolio_scope: portfolioScope,
      brief_type: briefType,
      content: narrative,
      context_package_id: portfolioContext.id
    }).select('id').single();

    if (error || !brief) throw new Error("Failed to generate Revenue Brief");

    return brief.id;
  }
}
