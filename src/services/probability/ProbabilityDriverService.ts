import { supabase } from "@/integrations/supabase/client";

export type DriverType = 'POSITIVE' | 'NEGATIVE' | 'RISK' | 'ACCELERATOR' | 'BLOCKER';
export type DriverSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class ProbabilityDriverService {
  /**
   * Adds a new probability driver to an opportunity's profile.
   */
  static async addDriver(profileId: string, opportunityId: string, type: DriverType, severity: DriverSeverity, sourceEngine: string, description: string) {
    const { data, error } = await supabase
      .from('probability_drivers')
      .insert({
        profile_id: profileId,
        opportunity_id: opportunityId,
        driver_type: type,
        severity,
        source_engine: sourceEngine,
        description
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves all active drivers for an opportunity.
   */
  static async getDriversByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('probability_drivers')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Archives or removes a driver (soft delete/status update).
   */
  static async archiveDriver(driverId: string) {
    const { data, error } = await supabase
      .from('probability_drivers')
      .update({ status: 'ARCHIVED' })
      .eq('id', driverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
