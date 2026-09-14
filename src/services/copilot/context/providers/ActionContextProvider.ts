import { supabase } from "@/integrations/supabase/client";

export class ActionContextProvider {
  /**
   * Fetches Action Intelligence (Priorities, NBA) and formats it for the LLM.
   */
  static async getContext(opportunityId: string) {
    const { data: nbas } = await supabase
      .from('action_recommendations')
      .select('id, action_type, description, impact_score')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE')
      .order('impact_score', { ascending: false })
      .limit(3);

    const { data: priority } = await supabase
      .from('opportunity_priorities')
      .select('id, priority_level, priority_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    return {
      type: "ACTION_INTELLIGENCE",
      source_system: "action_recommendations",
      source_id: priority?.id, // Taking priority ID as root
      data: {
        PriorityLevel: priority?.priority_level || 'UNKNOWN',
        PriorityScore: priority?.priority_score || 0,
        TopActions: nbas?.map(nba => ({
          Action: nba.action_type,
          Description: nba.description,
          Impact: `+${nba.impact_score}% win prob`
        })) || []
      }
    };
  }
}
