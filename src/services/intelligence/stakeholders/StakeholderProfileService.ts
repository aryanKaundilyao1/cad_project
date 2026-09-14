import { supabase } from "@/integrations/supabase/client";
import { StakeholderProfile, StakeholderStatus } from "./StakeholderTypes";

export class StakeholderProfileService {
  /**
   * Retrieves a stakeholder profile for a specific contact on a specific deal.
   */
  static async getProfile(opportunityId: string, contactId: string): Promise<StakeholderProfile | null> {
    const { data, error } = await supabase
      .from('stakeholder_profiles')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('contact_id', contactId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching stakeholder profile:", error);
      throw error;
    }

    return data as StakeholderProfile | null;
  }

  /**
   * Retrieves all stakeholder profiles for a given opportunity.
   */
  static async getProfilesByOpportunity(opportunityId: string): Promise<StakeholderProfile[]> {
    const { data, error } = await supabase
      .from('stakeholder_profiles')
      .select('*')
      .eq('opportunity_id', opportunityId);

    if (error) {
      console.error("Error fetching stakeholder profiles:", error);
      throw error;
    }

    return data as StakeholderProfile[];
  }

  /**
   * Creates or returns an existing stakeholder profile for a contact on a deal.
   */
  static async getOrCreateProfile(opportunityId: string, contactId: string): Promise<StakeholderProfile> {
    const existing = await this.getProfile(opportunityId, contactId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('stakeholder_profiles')
      .insert({
        opportunity_id: opportunityId,
        contact_id: contactId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating stakeholder profile:", error);
      throw error;
    }

    return data as StakeholderProfile;
  }
}
