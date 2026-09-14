import { supabase } from "@/integrations/supabase/client";
import { RevenueAuditService } from "./RevenueAuditService";
import { RevenuePermissionService } from "./RevenuePermissionService";

export class RevenueSessionService {
  /**
   * Initializes a macro-level Revenue Copilot session.
   */
  static async createSession(userId: string, portfolioScope: string) {
    // 1. Strict Permission Check
    const hasAccess = await RevenuePermissionService.validateAccess(userId, portfolioScope);
    if (!hasAccess) {
      await RevenueAuditService.logEvent(userId, null, 'PERMISSION_DENIED', { scope: portfolioScope });
      throw new Error("Unauthorized: Insufficient privileges for this portfolio scope.");
    }

    // 2. Create Session
    const { data: session, error } = await supabase.from('revenue_sessions').insert({
      user_id: userId,
      title: 'New Revenue Analysis',
      portfolio_scope: portfolioScope
    }).select('id').single();

    if (error || !session) throw new Error("Failed to create Revenue Session");

    // 3. Audit
    await RevenueAuditService.logEvent(userId, session.id, 'SESSION_CREATED', { scope: portfolioScope });

    return session;
  }
}
