import { supabase } from "@/integrations/supabase/client";
import { ExecutionAuditService } from "./ExecutionAuditService";

export class HumanApprovalService {
  /**
   * Records explicit consent, rejection, or edit requests from users.
   */
  static async processApproval(proposalId: string, approverId: string, action: 'APPROVED' | 'REJECTED' | 'EDITED', reason?: string, modifiedPayload?: any) {
    const { data: approval, error } = await supabase.from('execution_approvals').insert({
      proposal_id: proposalId,
      approver_id: approverId,
      action,
      reason,
      modified_payload: modifiedPayload
    }).select('id').single();

    if (error || !approval) throw new Error("Failed to record approval");

    await ExecutionAuditService.logAudit(proposalId, 'PROPOSAL', 'APPROVAL_PROCESSED', { action, approverId });

    if (action === 'APPROVED' || action === 'EDITED') {
      await supabase.from('execution_proposals').update({ status: 'APPROVED' }).eq('id', proposalId);
      // MOCK: Generate the execution_tasks record here
    } else {
      await supabase.from('execution_proposals').update({ status: 'REJECTED' }).eq('id', proposalId);
    }

    return approval.id;
  }
}
