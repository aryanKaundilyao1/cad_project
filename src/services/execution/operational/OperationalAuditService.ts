import { supabase } from "@/integrations/supabase/client";

export class OperationalAuditService {
  /**
   * Logs all lifecycle events for operational compliance.
   */
  static async logAudit(taskId: string, action: string, data: any) {
    await supabase.from('operational_audit_logs').insert({
      task_id: taskId,
      action: action,
      audit_data: data
    });
  }
}
