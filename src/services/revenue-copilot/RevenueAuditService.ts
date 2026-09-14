import { supabase } from "@/integrations/supabase/client";

export class RevenueAuditService {
  /**
   * Secure, immutable logging for Revenue Copilot events.
   */
  static async logEvent(userId: string, sessionId: string | null, eventType: string, metadata: any = {}) {
    await supabase.from('revenue_audit_logs').insert({
      user_id: userId,
      session_id: sessionId,
      event_type: eventType,
      event_metadata: metadata
    });
  }
}
