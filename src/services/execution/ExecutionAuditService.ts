import { supabase } from "@/integrations/supabase/client";

export class ExecutionAuditService {
  /**
   * Writes every transition to execution_audit_logs, proving that the task trace resolves back to certified intelligence.
   */
  static async logAudit(entityId: string, entityType: string, action: string, data: any) {
    await supabase.from('execution_audit_logs').insert({
      entity_id: entityId,
      entity_type: entityType,
      action: action,
      audit_data: data
    });
  }
}
