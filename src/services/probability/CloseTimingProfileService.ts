import { supabase } from "@/integrations/supabase/client";

export class CloseTimingProfileService {
  /**
   * Initializes a Close Timing Profile for an Opportunity.
   * Note: Usually created automatically via DB triggers.
   */
  static async createProfile(opportunityId: string) {
    const { data, error } = await supabase
      .from('close_timing_profiles')
      .insert({ opportunity_id: opportunityId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves a Close Timing Profile by Opportunity ID.
   */
  static async getProfileByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('close_timing_profiles')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Updates the Close Timing Profile.
   */
  static async updateProfile(opportunityId: string, updates: { expected_window_start?: string; expected_window_end?: string; confidence_band?: string; timing_status?: string }) {
    const { data, error } = await supabase
      .from('close_timing_profiles')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('opportunity_id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
