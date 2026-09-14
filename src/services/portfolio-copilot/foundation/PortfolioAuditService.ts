import { supabase } from "@/integrations/supabase/client";

export class PortfolioAuditService {
  /**
   * Deeply tracks every access attempt across the intelligence graph.
   */
  static async logAccess(sessionId: string, userId: string, action: string, metadata: any) {
    await supabase.from('portfolio_audit_logs').insert({
      session_id: sessionId,
      user_id: userId,
      action: action,
      metadata: metadata
    });
  }
}
