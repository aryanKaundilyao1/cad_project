import { supabase } from "@/integrations/supabase/client";
import { ActionSequenceEngine } from "./ActionSequenceEngine";
import { OutcomeIntelligenceEngine } from "./OutcomeIntelligenceEngine";

export class ExecutionTrackingEngine {
  /**
   * Updates the status of a specific step in the execution sequence.
   */
  static async updateStepStatus(stepExecutionId: string, status: string, notes?: string) {
    const { data: stepExec } = await supabase
      .from('playbook_step_executions')
      .update({
        status,
        notes,
        completed_at: status === 'COMPLETED' || status === 'SKIPPED' ? new Date().toISOString() : null
      })
      .eq('id', stepExecutionId)
      .select('execution_id')
      .single();

    if (!stepExec) return;

    // Check if the entire execution is completed
    const { data: remainingSteps } = await supabase
      .from('playbook_step_executions')
      .select('status')
      .eq('execution_id', stepExec.execution_id)
      .in('status', ['PENDING', 'IN_PROGRESS']);

    if (!remainingSteps || remainingSteps.length === 0) {
      await supabase
        .from('playbook_executions')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', stepExec.execution_id);
        
      // Queue outcome measurement snapshot
      await OutcomeIntelligenceEngine.scheduleOutcomeMeasurement(stepExec.execution_id);
    }
  }
}
