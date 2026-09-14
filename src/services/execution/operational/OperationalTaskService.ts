import { supabase } from "@/integrations/supabase/client";
import { OperationalTraceabilityEngine } from "./OperationalTraceabilityEngine";
import { OperationalAssignmentService } from "./OperationalAssignmentService";

export class OperationalTaskService {
  /**
   * Creates a proposed CRM task linked to intelligence.
   */
  static async createTask(proposalId: string, actionIntelligenceId: string, payload: any) {
    const traceabilityMetadata = await OperationalTraceabilityEngine.generateTraceability(actionIntelligenceId);
    
    const { data: task, error } = await supabase.from('operational_tasks').insert({
      proposal_id: proposalId,
      task_metadata: payload,
      status: 'PENDING_APPROVAL',
      traceability_metadata: traceabilityMetadata
    }).select('*').single();

    if (error || !task) throw new Error("Failed to create operational task");

    await OperationalAssignmentService.assignTask(task.id, payload);

    return task;
  }
}
