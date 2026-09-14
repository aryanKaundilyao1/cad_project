import { supabase } from '@/integrations/supabase/client';

export type ActionPayload = {
  title?: string;
  type?: string;
  priority?: string;
  due_in_days?: number;
  stage?: string;
  playbook_id?: string;
};

export type AutomationRule = {
  id: string;
  rule_name: string;
  trigger_event: string;
  conditions: Record<string, any>;
  action_type: string;
  action_payload: ActionPayload;
  is_active: boolean;
};

export class AutomationEngineService {
  /**
   * Evaluates and executes automation rules based on a trigger event.
   */
  static async evaluateRules(triggerEvent: string, opportunityId: string, userId: string, context: Record<string, any> = {}) {
    try {
      const { data: matchingRules, error } = await supabase.rpc('evaluate_automation_rules', {
        p_trigger_event: triggerEvent,
        p_opportunity_id: opportunityId,
        p_user_id: userId,
        p_context: context
      });

      if (error) throw error;
      if (!matchingRules || matchingRules.length === 0) return { success: true, executed: 0 };

      let executedCount = 0;
      
      for (const rule of matchingRules) {
        const payload = rule.action_payload as ActionPayload;
        
        switch (rule.action_type) {
          case 'CREATE_TASK':
            await this.createTask(opportunityId, userId, payload);
            executedCount++;
            break;
            
          case 'MOVE_STAGE':
            if (payload.stage) {
              await this.moveStage(opportunityId, payload.stage);
              executedCount++;
            }
            break;
            
          case 'ASSIGN_PLAYBOOK':
            if (payload.playbook_id) {
              await this.assignPlaybook(opportunityId, payload.playbook_id);
              executedCount++;
            }
            break;
        }
      }

      return { success: true, executed: executedCount };
    } catch (err) {
      console.error('Automation Engine Error:', err);
      return { success: false, error: err };
    }
  }

  private static async createTask(opportunityId: string, userId: string, payload: ActionPayload) {
    const dueDate = payload.due_in_days 
      ? new Date(Date.now() + payload.due_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Get workspace ID for the opportunity
    const { data: opp } = await supabase.from('opportunities').select('workspace_id').eq('id', opportunityId).single();
    if (!opp) return;

    const { error } = await supabase.from('tasks').insert({
      workspace_id: opp.workspace_id,
      opportunity_id: opportunityId,
      title: payload.title || 'Automated Task',
      task_type: payload.type || 'custom',
      priority: payload.priority || 'medium',
      due_date: dueDate,
      status: 'pending',
      assigned_to: userId,
      created_by: userId
    });

    if (error) console.error("Failed to create automated task:", error);
  }

  private static async moveStage(opportunityId: string, newStage: string) {
    const { error } = await supabase.from('opportunities')
      .update({ stage: newStage })
      .eq('id', opportunityId);
      
    if (error) console.error("Failed to move stage:", error);
  }

  private static async assignPlaybook(opportunityId: string, playbookId: string) {
    const { error } = await supabase.from('action_sequences').insert({
      opportunity_id: opportunityId,
      playbook_id: playbookId,
      status: 'IN_PROGRESS'
    });
    
    if (error) console.error("Failed to assign playbook:", error);
  }
}
