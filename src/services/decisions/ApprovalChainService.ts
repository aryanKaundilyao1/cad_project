import { supabase } from "@/integrations/supabase/client";
import { DecisionEventService } from "./DecisionEventService";

export class ApprovalChainService {
  /**
   * Records a stakeholder granting approval for a specific step.
   */
  static async grantApproval(approvalMemberId: string, decisionProfileId: string) {
    const { data, error } = await supabase
      .from('approval_members')
      .update({ 
        status: 'APPROVED', 
        approved_at: new Date().toISOString() 
      })
      .eq('id', approvalMemberId)
      .select()
      .single();

    if (error) throw error;

    await DecisionEventService.logEvent(decisionProfileId, 'APPROVAL_GRANTED', { 
      approvalMemberId, 
      stakeholderId: data.stakeholder_id 
    });

    return data;
  }
}
