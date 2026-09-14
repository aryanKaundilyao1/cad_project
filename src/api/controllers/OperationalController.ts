import { OperationalApprovalService } from "../services/execution/operational/OperationalApprovalService";
import { OperationalExecutionEngine } from "../services/execution/operational/OperationalExecutionEngine";

export class OperationalController {
  /**
   * API endpoints for handling operational workflows and approvals.
   */
  
  static async handleCreateProposal(req: any, res: any) {
    try {
      const { proposalId, actionIntelligenceId, payload } = req.body;
      const task = await OperationalExecutionEngine.processOperationalProposal(proposalId, actionIntelligenceId, payload);
      res.status(201).json({ task });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async handleApproveTask(req: any, res: any) {
    try {
      const { id } = req.params;
      const { approverId, modifiedPayload, reason } = req.body;
      await OperationalApprovalService.processApproval(id, approverId, 'APPROVED', modifiedPayload, reason);
      res.status(200).json({ status: 'APPROVED_AND_QUEUED_FOR_EXECUTION' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
