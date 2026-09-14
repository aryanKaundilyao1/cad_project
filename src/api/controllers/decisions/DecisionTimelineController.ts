import { supabase } from "@/integrations/supabase/client";

export class DecisionTimelineController {
  /**
   * Fetches the paginated history of decision events.
   */
  static async getEvents(decisionProfileId: string, limit: number = 20, offset: number = 0) {
    const { data, error, count } = await supabase
      .from('decision_events')
      .select('*', { count: 'exact' })
      .eq('decision_profile_id', decisionProfileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      events: data,
      totalCount: count || 0
    };
  }
}
