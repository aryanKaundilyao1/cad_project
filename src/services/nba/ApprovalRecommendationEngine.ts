import { supabase } from "@/integrations/supabase/client";

export class ApprovalRecommendationEngine {
  static async evaluate(opportunityId: string) {
    const recommendations = [];
    
    // Check for stalled approvals
    const { data: approvals } = await supabase
      .from('approval_intelligence')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'STALLED');
      
    if (approvals && approvals.length > 0) {
      for (const approval of approvals) {
        recommendations.push({
          type: 'UNBLOCK_APPROVAL',
          action: `Unblock ${approval.approval_type} Approval`,
          driver: 'STALLED_APPROVAL',
          evidence: {
            type: 'APPROVAL',
            source_id: approval.id,
            description: `${approval.approval_type} approval has been stalled.`
          }
        });
      }
    }

    return recommendations;
  }
}
