import { supabase } from "@/integrations/supabase/client";

export class ActionGeneratorService {
  /**
   * Evaluates an opportunity and generates a recommended action if it meets the criteria.
   */
  static async evaluateAndGenerate(opportunityId: string, score: number) {
    if (score < 60) {
      return null; // Do not generate actions for low scoring opportunities
    }

    try {
      // Check if an active recommendation already exists
      const { data: existing } = await supabase
        .from('action_recommendations')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (existing) {
        return null; // Already has an active recommendation
      }

      const recType = score > 80 ? 'ENGAGE_STAKEHOLDER' : 'REVIEW_REQUIREMENTS';
      const description = score > 80 
        ? 'High score detected. Immediate engagement recommended.'
        : 'Moderate score. Review opportunity requirements.';

      const { data, error } = await supabase.from('action_recommendations').insert({
        opportunity_id: opportunityId,
        recommendation_type: recType,
        source: 'WORKFLOW_ENGINE',
        status: 'ACTIVE',
        priority_score: score,
        description: description
      }).select('id').single();

      if (error) {
        console.error("Failed to generate action recommendation:", error);
        return null;
      }

      return data;
    } catch (e) {
      console.error("Error evaluating action recommendation:", e);
      return null;
    }
  }
}
