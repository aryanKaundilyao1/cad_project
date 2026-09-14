import { supabase } from "@/integrations/supabase/client";

export class ExecutionValidationSuite {
  /**
   * Base suite for all execution validation runners.
   */
  static async createRun(suiteName: string) {
    const { data: suite } = await supabase.from('execution_validation_suites').insert({
      suite_name: suiteName,
      target_layer: 'SAFETY'
    }).select('id').single();

    if (!suite) throw new Error("Failed to create suite");

    const { data: run } = await supabase.from('execution_validation_runs').insert({
      suite_id: suite.id,
      status: 'IN_PROGRESS'
    }).select('id').single();

    if (!run) throw new Error("Failed to create run");
    return run.id;
  }

  static async recordResult(runId: string, scenarioName: string, isPassed: boolean, failureReason?: string) {
    await supabase.from('execution_validation_results').insert({
      run_id: runId,
      scenario_name: scenarioName,
      is_passed: isPassed,
      failure_reason: failureReason
    });
  }
}
