import { CommunicationDraftingService } from "./CommunicationDraftingService";
import { CommunicationAuditService } from "./CommunicationAuditService";

export class CommunicationExecutionEngine {
  /**
   * The orchestrator that takes an Action Recommendation and passes it to the Drafting Service.
   */
  static async processCommunicationProposal(proposalId: string, actionIntelligenceId: string) {
    try {
      const draft = await CommunicationDraftingService.generateDraft(proposalId, actionIntelligenceId);
      await CommunicationAuditService.logAudit(draft.id, 'DRAFT_CREATED', { proposalId });
      return draft;
    } catch (error) {
      console.error("Failed to process communication proposal", error);
      throw error;
    }
  }
}
