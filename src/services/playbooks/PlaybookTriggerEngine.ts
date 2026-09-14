import { supabase } from "@/integrations/supabase/client";

export class PlaybookTriggerEngine {
  /**
   * Scans NBAs and Priorities to determine if a Playbook should be activated automatically.
   */
  static async evaluate(opportunityId: string) {
    // Check highest priority
    const { data: priority } = await supabase
      .from('opportunity_priorities')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (!priority || priority.priority_score < 75) return null; // Only trigger for high priority deals

    // Find the highest impact active recommendation
    const { data: rec } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE')
      .order('impact_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rec) return null;

    // Find a playbook that matches the recommendation type
    const { data: playbook } = await supabase
      .from('action_playbooks')
      .select('*')
      .eq('trigger_type', rec.recommendation_type)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!playbook) return null;

    return {
      playbook_id: playbook.id,
      trigger_source: `NBA_ID_${rec.id}`
    };
  }
}
