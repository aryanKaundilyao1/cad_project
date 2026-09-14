import { supabase } from "@/integrations/supabase/client";

export class OperationalWorkflowOrchestrator {
  /**
   * Orchestrates multi-step operational flows (e.g. Create Meeting -> Create Follow Up Task -> Alert Manager).
   */
  static async createWorkflow(name: string, payload: any) {
    const { data: workflow, error } = await supabase.from('operational_workflows').insert({
      name,
      workflow_metadata: payload,
      status: 'PENDING'
    }).select('*').single();
    
    if (error || !workflow) throw new Error("Failed to create workflow");
    return workflow;
  }
}
