import { supabase } from "@/integrations/supabase/client";

export class CommunicationAuditService {
  /**
   * Logs all lifecycle events for communication compliance.
   */
  static async logAudit(draftId: string, action: string, data: any) {
    await supabase.from('communication_audit_logs').insert({
      draft_id: draftId,
      action: action,
      audit_data: data
    });
  }
}
