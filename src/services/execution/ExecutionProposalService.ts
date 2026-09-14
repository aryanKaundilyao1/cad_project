import { supabase } from "@/integrations/supabase/client";

export class ExecutionProposalService {
  /**
   * Translates Action Intelligence into actionable proposals.
   */
  static async createProposal(sourceIntelligenceId: string, proposalType: string, payload: any) {
    const { data: proposal, error } = await supabase.from('execution_proposals').insert({
      source_intelligence_id: sourceIntelligenceId,
      proposal_type: proposalType,
      proposed_payload: payload,
      status: 'PENDING_APPROVAL'
    }).select('id').single();

    if (error || !proposal) throw new Error("Failed to create proposal");
    return proposal.id;
  }
}
