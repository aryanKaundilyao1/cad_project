import { supabase } from "@/integrations/supabase/client";
import { PortfolioAuditService } from "./PortfolioAuditService";

export class PortfolioSessionService {
  /**
   * Initializes a cross-domain exploration session.
   */
  static async createSession(userId: string) {
    const { data: session, error } = await supabase.from('portfolio_sessions').insert({
      user_id: userId,
      status: 'ACTIVE'
    }).select('id').single();

    if (error || !session) throw new Error("Failed to create portfolio session");

    await PortfolioAuditService.logAccess(session.id, userId, 'SESSION_CREATED', { status: 'SUCCESS' });
    return session.id;
  }

  static async archiveSession(sessionId: string, userId: string) {
    await supabase.from('portfolio_sessions').update({ status: 'ARCHIVED' }).eq('id', sessionId);
    await PortfolioAuditService.logAccess(sessionId, userId, 'SESSION_ARCHIVED', { status: 'SUCCESS' });
  }
}
