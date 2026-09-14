import { supabase } from "@/integrations/supabase/client";

export class ProbabilityHistoryService {
  /**
   * Logs an event that impacted the probability profile.
   */
  static async logEvent(profileId: string, eventType: string, previousState: any, newState: any) {
    const { data, error } = await supabase
      .from('purchase_probability_history')
      .insert({
        profile_id: profileId,
        event_type: eventType,
        previous_state: previousState,
        new_state: newState
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves history for a profile.
   */
  static async getHistoryByProfile(profileId: string) {
    const { data, error } = await supabase
      .from('purchase_probability_history')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
