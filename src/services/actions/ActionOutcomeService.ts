import { supabase } from "@/integrations/supabase/client";

export class ActionOutcomeService {
  /**
   * Records the outcome of a recommendation execution.
   */
  static async recordOutcome(recommendationId: string, status: string, notes?: string) {
    const { data, error } = await supabase
      .from('action_outcomes')
      .insert({
        recommendation_id: recommendationId,
        execution_status: status,
        execution_date: new Date().toISOString(),
        notes: notes
      })
      .select()
      .single();

    if (error) throw error;
    
    // Also update the recommendation status to COMPLETED, DISMISSED, etc. based on the outcome
    let recStatus = 'COMPLETED';
    if (status === 'DISMISSED') recStatus = 'DISMISSED';
    if (status === 'FAILED') recStatus = 'ACTIVE'; // leave it active to try again
    
    await supabase
      .from('action_recommendations')
      .update({ status: recStatus })
      .eq('id', recommendationId);

    return data;
  }
}
