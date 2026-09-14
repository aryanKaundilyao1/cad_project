import { supabase } from "@/integrations/supabase/client";

export class ExecutionQueueService {
  /**
   * Manages the state machine of an execution task.
   */
  static async getQueuedTasks() {
    const { data: tasks } = await supabase.from('execution_queue')
      .select('*, execution_tasks(*)')
      .eq('status', 'QUEUED');
    return tasks || [];
  }

  static async updateStatus(queueId: string, status: 'RUNNING' | 'COMPLETED' | 'FAILED') {
    await supabase.from('execution_queue').update({ status }).eq('id', queueId);
  }

  static async handleFailure(queueId: string, error: any) {
    await this.updateStatus(queueId, 'FAILED');
    // MOCK: Add retry logic, dead letter queue
  }
}
