import { CommunicationApprovalService } from "../services/execution/communication/CommunicationApprovalService";
import { CommunicationExecutionEngine } from "../services/execution/communication/CommunicationExecutionEngine";

export class CommunicationController {
  /**
   * API endpoints for handling communication drafts and approvals.
   */
  
  static async handleCreateProposal(req: any, res: any) {
    try {
      const { proposalId, actionIntelligenceId } = req.body;
      const draft = await CommunicationExecutionEngine.processCommunicationProposal(proposalId, actionIntelligenceId);
      res.status(201).json({ draft });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async handleApproveDraft(req: any, res: any) {
    try {
      const { id } = req.params;
      const { approverId, modifiedSubject, modifiedBody } = req.body;
      await CommunicationApprovalService.processApproval(id, approverId, 'APPROVED', modifiedSubject, modifiedBody);
      res.status(200).json({ status: 'APPROVED_AND_QUEUED_FOR_DELIVERY' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
