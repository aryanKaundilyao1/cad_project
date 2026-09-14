import { supabase } from "@/integrations/supabase/client";
import { StakeholderRelationship, RelationshipType } from "./StakeholderTypes";

export class StakeholderRelationshipService {
  /**
   * Retrieves all inbound and outbound relationships for a given stakeholder profile.
   */
  static async getRelationships(profileId: string): Promise<{
    outbound: StakeholderRelationship[];
    inbound: StakeholderRelationship[];
  }> {
    const { data: outboundData, error: outboundError } = await supabase
      .from('stakeholder_relationships')
      .select('*')
      .eq('source_profile_id', profileId);

    if (outboundError) throw outboundError;

    const { data: inboundData, error: inboundError } = await supabase
      .from('stakeholder_relationships')
      .select('*')
      .eq('target_profile_id', profileId);

    if (inboundError) throw inboundError;

    return {
      outbound: outboundData as StakeholderRelationship[],
      inbound: inboundData as StakeholderRelationship[]
    };
  }

  /**
   * Creates a relationship (edge) between two stakeholder profiles.
   */
  static async createRelationship(
    sourceProfileId: string,
    targetProfileId: string,
    relationshipType: RelationshipType,
    strength: number = 5
  ): Promise<StakeholderRelationship> {
    const { data, error } = await supabase
      .from('stakeholder_relationships')
      .upsert({
        source_profile_id: sourceProfileId,
        target_profile_id: targetProfileId,
        relationship_type: relationshipType,
        strength: strength
      }, { onConflict: 'source_profile_id, target_profile_id, relationship_type' })
      .select()
      .single();

    if (error) throw error;
    return data as StakeholderRelationship;
  }
}
