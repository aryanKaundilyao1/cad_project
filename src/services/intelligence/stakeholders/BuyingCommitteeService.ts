import { supabase } from "@/integrations/supabase/client";
import { BuyingCommittee, CommitteeMember } from "./StakeholderTypes";

export class BuyingCommitteeService {
  /**
   * Retrieves or creates the central buying committee for an opportunity.
   */
  static async getOrCreateCommittee(opportunityId: string): Promise<BuyingCommittee> {
    const { data: existing, error: fetchError } = await supabase
      .from('buying_committees')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return existing as BuyingCommittee;

    const { data: newCommittee, error: insertError } = await supabase
      .from('buying_committees')
      .insert({ opportunity_id: opportunityId })
      .select()
      .single();

    if (insertError) throw insertError;
    return newCommittee as BuyingCommittee;
  }

  /**
   * Retrieves all members of a specific buying committee along with their role metadata.
   */
  static async getCommitteeMembers(committeeId: string): Promise<CommitteeMember[]> {
    const { data, error } = await supabase
      .from('committee_members')
      .select('*, stakeholder_role_definitions(*)')
      .eq('committee_id', committeeId);

    if (error) throw error;
    return data as CommitteeMember[];
  }

  /**
   * Adds a stakeholder profile to a buying committee with a specific role.
   */
  static async addMember(committeeId: string, profileId: string, roleDefinitionId: string): Promise<CommitteeMember> {
    const { data, error } = await supabase
      .from('committee_members')
      .insert({
        committee_id: committeeId,
        stakeholder_profile_id: profileId,
        role_definition_id: roleDefinitionId
      })
      .select()
      .single();

    if (error) throw error;
    return data as CommitteeMember;
  }
}
