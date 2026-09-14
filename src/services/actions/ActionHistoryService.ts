import { supabase } from "@/integrations/supabase/client";

export class ActionHistoryService {
  /**
   * Records a status change in the action's lifecycle.
   */
  static async logStatusChange(recommendationId: string, previousStatus: string, newStatus: string, userId?: string) {
    const { data, error } = await supabase
      .from('action_history')
      .insert({
        recommendation_id: recommendationId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
