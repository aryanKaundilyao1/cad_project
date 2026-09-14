import { supabase } from "@/integrations/supabase/client";

export class ActionRecommendationService {
  /**
   * Fetches all active recommendations for a given opportunity.
   */
  static async getActiveRecommendations(opportunityId: string) {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE')
      .order('priority_score', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  /**
   * Creates a new action recommendation in DRAFT state.
   */
  static async createRecommendation(opportunityId: string, type: string, source: string, description: string, priorityScore: number) {
    const { data, error } = await supabase
      .from('action_recommendations')
      .insert({
        opportunity_id: opportunityId,
        recommendation_type: type,
        source: source,
        description: description,
        priority_score: priorityScore,
        status: 'DRAFT'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Updates the status of a recommendation.
   */
  static async updateStatus(id: string, newStatus: string) {
    const { data, error } = await supabase
      .from('action_recommendations')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
