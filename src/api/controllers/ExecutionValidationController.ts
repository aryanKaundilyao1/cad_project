import { AutonomousExecutionCertificationEngine } from "../services/execution/certification/AutonomousExecutionCertificationEngine";

export class ExecutionValidationController {
  /**
   * API endpoints for handling execution certification.
   */
  
  static async handleRunCertification(req: any, res: any) {
    try {
      const report = await AutonomousExecutionCertificationEngine.runFullCertification();
      res.status(200).json({ report });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
