import { supabase } from "@/integrations/supabase/client";
import { CommunicationAuditService } from "./CommunicationAuditService";
import { CommunicationDeliveryOrchestrator } from "./CommunicationDeliveryOrchestrator";

export class CommunicationApprovalService {
  /**
   * Human-in-the-loop sign-off on the draft.
   */
  static async processApproval(draftId: string, approverId: string, action: 'APPROVED' | 'REJECTED' | 'REVISE', modifiedSubject?: string, modifiedBody?: string) {
    const { data: approval, error } = await supabase.from('communication_approvals').insert({
      draft_id: draftId,
      approver_id: approverId,
      action,
      modified_subject: modifiedSubject,
      modified_body: modifiedBody
    }).select('id').single();

    if (error || !approval) throw new Error("Failed to record communication approval");

    await CommunicationAuditService.logAudit(draftId, `APPROVAL_${action}`, { approverId });

    if (action === 'APPROVED') {
      await supabase.from('communication_drafts').update({ status: 'APPROVED' }).eq('id', draftId);
      await CommunicationDeliveryOrchestrator.queueDelivery(draftId);
    } else if (action === 'REJECTED') {
      await supabase.from('communication_drafts').update({ status: 'REJECTED' }).eq('id', draftId);
    }

    return approval.id;
  }
}
