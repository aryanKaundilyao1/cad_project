import { ExecutionCertificationEngine } from "../services/execution/governance/ExecutionCertificationEngine";
import { ExecutionExplainabilityEngine } from "../services/execution/governance/ExecutionExplainabilityEngine";

export class ExecutionGovernanceController {
  /**
   * API endpoints for handling enterprise execution governance.
   */
  
  static async handleCertifyExecution(req: any, res: any) {
    try {
      const { proposalId, payload } = req.body;
      const certification = await ExecutionCertificationEngine.certifyExecution(proposalId, payload);
      res.status(200).json({ certification });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async handleExplainExecution(req: any, res: any) {
    try {
      const { id } = req.params;
      const explanation = await ExecutionExplainabilityEngine.explainExecution(id);
      res.status(200).json({ explanation });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
