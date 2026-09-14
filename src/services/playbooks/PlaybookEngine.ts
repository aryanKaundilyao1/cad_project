import { supabase } from "@/integrations/supabase/client";
import { PlaybookTriggerEngine } from "./PlaybookTriggerEngine";
import { ActionSequenceEngine } from "./ActionSequenceEngine";

export class PlaybookEngine {
  /**
   * The master orchestrator for Phase 8D.
   * Triggered when an opportunity is updated to scan if a playbook should run.
   */
  static async runPipeline(opportunityId: string) {
    // 1. Check for Triggers
    const trigger = await PlaybookTriggerEngine.evaluate(opportunityId);
    if (!trigger) return;

    // 2. Prevent duplicate active executions of the same playbook
    const { data: existingExec } = await supabase
      .from('playbook_executions')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .eq('playbook_id', trigger.playbook_id)
      .in('status', ['STARTED', 'IN_PROGRESS']);

    if (existingExec && existingExec.length > 0) return;

    // 3. Create Execution Session
    const { data: newExec, error } = await supabase
      .from('playbook_executions')
      .insert({
        opportunity_id: opportunityId,
        playbook_id: trigger.playbook_id,
        trigger_source: trigger.trigger_source,
        status: 'STARTED'
      })
      .select()
      .single();

    if (error || !newExec) throw new Error("Failed to start playbook execution");

    // 4. Initialize Sequence Steps
    await ActionSequenceEngine.initializeSequence(newExec.id, trigger.playbook_id);

    return newExec;
  }
}
