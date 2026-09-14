import { supabase } from "@/integrations/supabase/client";

export class RevenueForecastProfileService {
  /**
   * Initializes a Revenue Forecast Profile for an Opportunity.
   * Note: Usually created automatically via DB triggers.
   */
  static async createProfile(opportunityId: string) {
    const { data, error } = await supabase
      .from('revenue_forecasts')
      .insert({ opportunity_id: opportunityId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves a Revenue Forecast Profile by Opportunity ID.
   */
  static async getProfileByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Updates the Forecast Profile.
   */
  static async updateProfile(opportunityId: string, updates: { forecast_status?: string; forecast_version?: number }) {
    const { data, error } = await supabase
      .from('revenue_forecasts')
      .update(updates)
      .eq('opportunity_id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Creates a snapshot of the current forecast state.
   */
  static async createSnapshot(forecastId: string, stateSnapshot: any) {
    const { data, error } = await supabase
      .from('forecast_snapshots')
      .insert({
        forecast_id: forecastId,
        state_snapshot: stateSnapshot
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
