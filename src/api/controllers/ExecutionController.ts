import { HumanApprovalService } from "../services/execution/HumanApprovalService";
import { ExecutionProposalService } from "../services/execution/ExecutionProposalService";

export class ExecutionController {
  /**
   * API endpoints for handling execution proposals and approvals.
   */
  
  static async handleCreateProposal(req: any, res: any) {
    try {
      const { sourceIntelligenceId, proposalType, payload } = req.body;
      const proposalId = await ExecutionProposalService.createProposal(sourceIntelligenceId, proposalType, payload);
      res.status(201).json({ id: proposalId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async handleApproveProposal(req: any, res: any) {
    try {
      const { id } = req.params;
      const { approverId } = req.body;
      await HumanApprovalService.processApproval(id, approverId, 'APPROVED');
      res.status(200).json({ status: 'APPROVED' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
