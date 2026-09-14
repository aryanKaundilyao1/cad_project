import { supabase } from "@/integrations/supabase/client";

export class ConversationMemoryEngine {
  /**
   * Retrieves the last N messages from a specific thread to provide context
   * for follow-up questions.
   */
  static async getThreadHistory(threadId: string, limit: number = 5) {
    const { data: messages } = await supabase
      .from('copilot_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!messages) return [];

    // Return in chronological order
    return messages.reverse();
  }
}
