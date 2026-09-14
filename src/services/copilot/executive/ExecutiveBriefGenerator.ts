import { supabase } from "@/integrations/supabase/client";
import { ExecutiveInsightEngine } from "./ExecutiveInsightEngine";
import { BriefExplanationEngine } from "./BriefExplanationEngine";
import { ConversationValidationPipeline } from "../conversation/ConversationValidationPipeline";
import { CitationAwareResponseEngine } from "../conversation/CitationAwareResponseEngine";
import { CopilotOrchestrator } from "../CopilotOrchestrator";

export class ExecutiveBriefGenerator {
  /**
   * The master orchestrator for generating an Executive Brief.
   * This is entirely automated and happens without user interaction (e.g. daily cron).
   */
  static async generateBrief(opportunityId: string, briefType: string, targetAudience: string, packageId: string) {
    // 1. Fetch the raw context package
    const { data: pkg } = await supabase
      .from('context_packages')
      .select('payload, session_id')
      .eq('id', packageId)
      .single();

    if (!pkg) throw new Error("Context Package not found");

    // 2. Extract Top Insights
    const topInsights = ExecutiveInsightEngine.extractTopInsights(pkg.payload);

    // 3. Build Prompt
    const systemPrompt = BriefExplanationEngine.buildBriefPrompt(briefType, topInsights, pkg.payload);

    // AI Integration Disabled for Phase 2
    const disabledResponse = "Executive Brief Generation is disabled pending Gemini API integration.";

    // 6. Save Brief
    const { data: briefRecord } = await supabase.from('executive_briefs').insert({
      opportunity_id: opportunityId,
      brief_type: briefType,
      target_audience: targetAudience,
      payload: { markdown: disabledResponse }
    }).select('id').single();

    return briefRecord;
  }
}
