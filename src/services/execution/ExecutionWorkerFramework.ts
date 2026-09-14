import { ExecutionQueueService } from "./ExecutionQueueService";
import { ExecutionAuditService } from "./ExecutionAuditService";

export class ExecutionWorkerFramework {
  /**
   * The consumer that pulls Approved tasks from the queue, executes them, and handles retries or failures.
   */
  static async processQueue() {
    const pendingTasks = await ExecutionQueueService.getQueuedTasks();
    
    for (const task of pendingTasks) {
      try {
        await ExecutionQueueService.updateStatus(task.id, 'RUNNING');
        await ExecutionAuditService.logAudit(task.id, 'QUEUE', 'TASK_STARTED', { task });

        // MOCK: Execute the task logic here based on task.task_type
        
        await ExecutionQueueService.updateStatus(task.id, 'COMPLETED');
        await ExecutionAuditService.logAudit(task.id, 'QUEUE', 'TASK_COMPLETED', { task });
      } catch (error) {
        await ExecutionQueueService.handleFailure(task.id, error);
        await ExecutionAuditService.logAudit(task.id, 'QUEUE', 'TASK_FAILED', { error });
      }
    }
  }
}
