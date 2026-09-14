import { supabase } from "@/integrations/supabase/client";
import { DecisionEventService } from "./DecisionEventService";

export class DecisionProfileService {
  /**
   * Initializes a Decision Profile for an Opportunity.
   */
  static async createProfile(opportunityId: string, ownerId?: string, targetDate?: string) {
    const { data, error } = await supabase
      .from('decision_profiles')
      .insert({
        opportunity_id: opportunityId,
        decision_owner_id: ownerId,
        target_decision_date: targetDate
      })
      .select()
      .single();

    if (error) throw error;

    await DecisionEventService.logEvent(data.id, 'DECISION_CREATED', { opportunityId, ownerId, targetDate });

    return data;
  }

  static async getProfileByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('decision_profiles')
      .select('*, decision_stages(*)')
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    return data;
  }
}
