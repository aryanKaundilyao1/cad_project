import { supabase } from "@/integrations/supabase/client";
import { PortfolioAuditService } from "./PortfolioAuditService";

export class PortfolioMessageService {
  /**
   * Persists messages in a portfolio session, tying them to a specific context snapshot.
   */
  static async storeMessage(sessionId: string, snapshotId: string | null, role: 'user' | 'assistant', content: string, userId: string) {
    const { data: message, error } = await supabase.from('portfolio_messages').insert({
      session_id: sessionId,
      snapshot_id: snapshotId,
      role: role,
      content: content
    }).select('id').single();

    if (error || !message) throw new Error("Failed to store portfolio message");

    await PortfolioAuditService.logAccess(sessionId, userId, 'MESSAGE_STORED', { message_id: message.id, role });
    return message.id;
  }
}
