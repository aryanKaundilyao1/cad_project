import { supabase } from "@/integrations/supabase/client";

export class PortfolioCitationEngine {
  /**
   * Explictly links the LLM response text back to the portfolio graph node.
   */
  static async persistCitation(messageId: string, index: parseInt, textSnippet: string, graphNodeId: string) {
    await supabase.from('portfolio_conversation_citations').insert({
      message_id: messageId,
      citation_index: index,
      source_snippet: textSnippet,
      graph_node_id: graphNodeId
    });
  }
}
