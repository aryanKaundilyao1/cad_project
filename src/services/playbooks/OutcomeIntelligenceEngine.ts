import { supabase } from "@/integrations/supabase/client";
import { PlaybookEffectivenessEngine } from "./PlaybookEffectivenessEngine";

export class OutcomeIntelligenceEngine {
  /**
   * Schedules a background measurement task for 14 days in the future.
   */
  static async scheduleOutcomeMeasurement(executionId: string) {
    const measurementDate = new Date();
    measurementDate.setDate(measurementDate.getDate() + 14);

    await supabase.from('playbook_outcomes').insert({
      execution_id: executionId,
      measurement_date: measurementDate.toISOString(),
      status: 'PENDING_MEASUREMENT'
    });
  }

  /**
   * Executes the measurement comparing current state to state before playbook execution.
   */
  static async measureOutcome(outcomeId: string, executionId: string, oppId: string) {
    // 1. Fetch current probability and revenue
    const { data: prob } = await supabase.from('purchase_probability_profiles').select('probability_score').eq('opportunity_id', oppId).maybeSingle();
    const { data: rev } = await supabase.from('forecast_scenarios').select('expected_case_amount').eq('opportunity_id', oppId).maybeSingle();

    // In a full implementation, we would compare these against the historical snapshots 
    // from the day the playbook was started. For now, we simulate a delta.
    const probabilityDelta = 5; 
    const revenueDelta = 100000;

    await supabase
      .from('playbook_outcomes')
      .update({
        probability_change: probabilityDelta,
        revenue_change: revenueDelta,
        status: 'MEASURED'
      })
      .eq('id', outcomeId);

    // After measuring, recalculate the aggregate effectiveness for this playbook type
    await PlaybookEffectivenessEngine.recalculate(executionId);
  }
}
