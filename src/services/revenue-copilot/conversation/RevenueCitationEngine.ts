import { supabase } from "@/integrations/supabase/client";

export class RevenueCitationEngine {
  /**
   * Persists the database links that prove the LLM's claims.
   */
  static async attachCitations(messageId: string, citations: any[]) {
    // Expected to receive parsed markdown citations mapping to Portfolio Context blocks
    for (const citation of citations) {
      await supabase.from('revenue_conversation_citations').insert({
        message_id: messageId,
        source_type: citation.type,
        source_id: citation.source_id,
        citation_text: citation.text
      });
    }
  }
}
