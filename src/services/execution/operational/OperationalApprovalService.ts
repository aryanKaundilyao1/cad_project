import { supabase } from "@/integrations/supabase/client";
import { OperationalAuditService } from "./OperationalAuditService";
import { OperationalExecutionEngine } from "./OperationalExecutionEngine";

export class OperationalApprovalService {
  /**
   * Human-in-the-loop sign-off on the operational change.
   */
  static async processApproval(taskId: string, approverId: string, action: 'APPROVED' | 'REJECTED' | 'REVISE' | 'ESCALATE', modifiedPayload?: any, reason?: string) {
    const { data: approval, error } = await supabase.from('operational_approvals').insert({
      task_id: taskId,
      approver_id: approverId,
      action,
      modified_payload: modifiedPayload,
      reason
    }).select('id').single();

    if (error || !approval) throw new Error("Failed to record operational approval");

    await OperationalAuditService.logAudit(taskId, `APPROVAL_${action}`, { approverId });

    if (action === 'APPROVED') {
      await supabase.from('operational_tasks').update({ status: 'APPROVED' }).eq('id', taskId);
      await supabase.from('operational_executions').insert({ task_id: taskId, status: 'QUEUED' });
      // In a real system, the ExecutionQueueService or Worker Framework would pick this up here
      await OperationalExecutionEngine.executeTask(taskId);
    } else if (action === 'REJECTED') {
      await supabase.from('operational_tasks').update({ status: 'REJECTED' }).eq('id', taskId);
    }

    return approval.id;
  }
}
