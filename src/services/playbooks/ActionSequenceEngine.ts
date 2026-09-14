import { supabase } from "@/integrations/supabase/client";

export class ActionSequenceEngine {
  /**
   * Initializes the step tracking for a playbook execution.
   */
  static async initializeSequence(executionId: string, playbookId: string) {
    const { data: steps } = await supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', playbookId)
      .order('step_order', { ascending: true });

    if (!steps || steps.length === 0) return;

    const execSteps = steps.map(step => ({
      execution_id: executionId,
      step_id: step.id,
      status: 'PENDING'
    }));

    await supabase.from('playbook_step_executions').insert(execSteps);
  }

  /**
   * Validates if a step can be executed (checks dependencies).
   */
  static async canExecuteStep(executionId: string, stepOrder: number) {
    if (stepOrder === 1) return true;

    // Check if the previous step is completed
    const { data: previousStep } = await supabase
      .from('playbook_step_executions')
      .select('status')
      .eq('execution_id', executionId)
      .eq('step_id.step_order', stepOrder - 1)
      .maybeSingle();

    return previousStep?.status === 'COMPLETED' || previousStep?.status === 'SKIPPED';
  }
}
