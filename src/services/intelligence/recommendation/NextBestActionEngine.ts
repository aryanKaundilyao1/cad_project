import { supabase } from "@/integrations/supabase/client";

export class NextBestActionEngine {
  /**
   * Generates or updates Next Best Actions for an opportunity based on rules.
   */
  static async evaluate(opportunityId: string) {
    // 1. Fetch Opportunity Context
    const { data: opp } = await supabase
      .from('opportunities')
      .select('*, company:jas_companies(*)')
      .eq('id', opportunityId)
      .single();

    if (!opp) return [];

    // 2. Fetch Active Rules
    const { data: rules } = await supabase
      .from('recommendation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority_weight', { ascending: false });

    if (!rules) return [];

    const generatedActions = [];

    // 3. Evaluate Rules against context (Simplified for Phase 4C)
    // Real implementation would parse `conditions` JSONB
    for (const rule of rules) {
      let isMatch = false;
      let explanation = "";

      if (rule.trigger_event === 'Stage Stagnation' && opp.stage === 'Qualification') {
        const lastUpdated = new Date(opp.updated_at).getTime();
        const daysStagnant = (Date.now() - lastUpdated) / (1000 * 3600 * 24);
        if (daysStagnant > 14) {
          isMatch = true;
          explanation = `Opportunity has been in Qualification for ${Math.floor(daysStagnant)} days.`;
        }
      } else if (rule.trigger_event === 'Tender Published' && opp.source === 'Lead Database Import') {
        // Just as an example rule trigger
        isMatch = true;
        explanation = "A related high-value tender was published.";
      }

      if (isMatch) {
        // 4. Create Recommendation if not exists
        const { data: existing } = await supabase
          .from('action_recommendations')
          .select('id')
          .eq('opportunity_id', opportunityId)
          .eq('recommendation_type', rule.action_type)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (!existing) {
          const { data: inserted } = await supabase
            .from('action_recommendations')
            .insert({
              opportunity_id: opportunityId,
              recommendation_type: rule.action_type,
              source: 'NBA_ENGINE',
              status: 'ACTIVE',
              priority_score: rule.priority_weight,
              description: rule.description,
              explanation: explanation
            })
            .select()
            .single();
          
          if (inserted) generatedActions.push(inserted);
        }
      }
    }

    return generatedActions;
  }
}
