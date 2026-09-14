import { supabase } from "@/integrations/supabase/client";

export class RevenueMemoryEngine {
  /**
   * Retrieves previous conversation context to support follow-up questions
   * (e.g., resolving "What about EMEA?" to "What is the forecast risk in EMEA?").
   */
  static async getThreadMemory(threadId: string) {
    const { data } = await supabase
      .from('revenue_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(10);
      
    return data || [];
  }
}
