import { supabase } from "@/integrations/supabase/client";

export class PurchaseProbabilityProfileService {
  /**
   * Initializes a Purchase Probability Profile for an Opportunity.
   * Note: Usually created automatically via DB triggers.
   */
  static async createProfile(opportunityId: string) {
    const { data, error } = await supabase
      .from('purchase_probability_profiles')
      .insert({ opportunity_id: opportunityId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves a Purchase Probability Profile by Opportunity ID.
   */
  static async getProfileByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('purchase_probability_profiles')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Updates the Probability Profile (used when recalculations happen).
   */
  static async updateProfileStatus(opportunityId: string, updates: { probability_status?: string; confidence_status?: string; trend_status?: string }) {
    const { data, error } = await supabase
      .from('purchase_probability_profiles')
      .update({
        ...updates,
        last_calculated_at: new Date().toISOString()
      })
      .eq('opportunity_id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
