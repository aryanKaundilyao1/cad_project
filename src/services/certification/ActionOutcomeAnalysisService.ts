import { supabase } from "@/integrations/supabase/client";

export class ActionOutcomeAnalysisService {
  /**
   * Compares the expected impact of a playbook against the actual measured outcome.
   */
  static async analyzeOutcome(outcomeId: string, executionId: string, expectedProb: number, expectedRev: number) {
    const { data: outcome } = await supabase
      .from('playbook_outcomes')
      .select('*')
      .eq('id', outcomeId)
      .maybeSingle();

    if (!outcome) return;

    const { data: exec } = await supabase
      .from('playbook_executions')
      .select('opportunity_id, playbook_id')
      .eq('id', executionId)
      .single();

    if (!exec) return;

    // Calculate Variance (lower is better, meaning prediction was accurate)
    const probVariance = Math.abs(expectedProb - (outcome.probability_change || 0));
    
    await supabase.from('action_outcome_analysis').insert({
      opportunity_id: exec.opportunity_id,
      execution_id: executionId,
      playbook_id: exec.playbook_id,
      expected_probability_change: expectedProb,
      actual_probability_change: outcome.probability_change,
      expected_revenue_change: expectedRev,
      actual_revenue_change: outcome.revenue_change,
      variance_score: probVariance
    });
  }
}
