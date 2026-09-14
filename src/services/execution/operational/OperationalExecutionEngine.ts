import { OperationalTaskService } from "./OperationalTaskService";
import { OperationalAuditService } from "./OperationalAuditService";

export class OperationalExecutionEngine {
  /**
   * Orchestrates the translation of a proposal into operational CRM tasks.
   */
  static async processOperationalProposal(proposalId: string, actionIntelligenceId: string, payload: any) {
    try {
      const task = await OperationalTaskService.createTask(proposalId, actionIntelligenceId, payload);
      await OperationalAuditService.logAudit(task.id, 'TASK_PROPOSED', { proposalId });
      return task;
    } catch (error) {
      console.error("Failed to process operational proposal", error);
      throw error;
    }
  }

  /**
   * Executes the physical CRM state change once the task is APPROVED.
   */
  static async executeTask(taskId: string) {
    // MOCK: Apply the payload to CRM state
    await OperationalAuditService.logAudit(taskId, 'TASK_EXECUTED', {});
  }
}
