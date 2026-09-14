import { supabase } from "@/integrations/supabase/client";

export class RevenueMessageService {
  /**
   * Persists conversational turns for a Revenue Copilot session.
   * Ensures every message is tightly bound to the exact context snapshot that generated it.
   */
  static async addMessage(sessionId: string, snapshotId: string | null, role: string, content: string) {
    const { data: message, error } = await supabase.from('revenue_messages').insert({
      session_id: sessionId,
      context_snapshot_id: snapshotId,
      role: role,
      content: content
    }).select('*').single();

    if (error || !message) throw new Error("Failed to save Revenue Message");

    return message;
  }
}
