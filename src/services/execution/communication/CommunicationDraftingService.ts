import { supabase } from "@/integrations/supabase/client";
import { CommunicationTraceabilityEngine } from "./CommunicationTraceabilityEngine";

export class CommunicationDraftingService {
  /**
   * Connects to the LLM to generate highly personalized text based on Action Intelligence.
   */
  static async generateDraft(proposalId: string, actionIntelligenceId: string) {
    // MOCK: Call LLM to generate text
    const draftedSubject = "Follow up regarding your recent decision";
    const draftedBody = "Hi Stakeholder,\n\nI noticed you had some concerns. Let's discuss.\n\nBest,\nSales Rep";

    const traceabilityMetadata = await CommunicationTraceabilityEngine.generateTraceability(actionIntelligenceId);

    const { data: draft, error } = await supabase.from('communication_drafts').insert({
      proposal_id: proposalId,
      subject: draftedSubject,
      body: draftedBody,
      channel: 'EMAIL',
      status: 'PENDING_APPROVAL',
      traceability_metadata: traceabilityMetadata
    }).select('*').single();

    if (error || !draft) throw new Error("Failed to generate communication draft");
    return draft;
  }
}
