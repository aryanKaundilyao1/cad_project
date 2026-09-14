import { supabase } from "@/integrations/supabase/client";

export class CopilotContextService {
  /**
   * Aggregates all structured intelligence for a given opportunity into a single JSON snapshot.
   * This forms the "Context" that the LLM will use to ground its responses.
   */
  static async buildContextSnapshot(opportunityId: string): Promise<any> {
    // 1. Fetch Opportunity Basics
    const { data: opp } = await supabase
      .from('opportunities')
      .select('name, amount, stage, current_revenue_forecast')
      .eq('id', opportunityId)
      .single();

    // 2. Fetch Priority & Risk Intelligence
    const { data: priority } = await supabase
      .from('opportunity_priorities')
      .select('priority_score, priority_level, priority_drivers(driver_type, description)')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    // 3. Fetch Next Best Action Intelligence
    const { data: nbas } = await supabase
      .from('action_recommendations')
      .select('action_type, description, impact_score')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE')
      .order('impact_score', { ascending: false })
      .limit(3);

    // Assembly
    const contextSnapshot = {
      timestamp: new Date().toISOString(),
      opportunity: opp,
      intelligence: {
        prioritization: priority,
        top_recommendations: nbas || []
      }
    };

    return contextSnapshot;
  }
}
