import { supabase } from '@/integrations/supabase/client';

export class PlaybookService {
  /**
   * Fetch available playbooks
   */
  static async getPlaybooks() {
    const { data, error } = await supabase
      .from('action_playbooks')
      .select('*, playbook_steps(*)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch active playbooks on an opportunity
   */
  static async getActivePlaybooks(opportunityId: string) {
    const { data, error } = await supabase
      .from('action_sequences')
      .select('*, action_playbooks(*, playbook_steps(*))')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'IN_PROGRESS');
      
    if (error) throw error;
    return data || [];
  }

  /**
   * Advance playbook step
   */
  static async completeStep(sequenceId: string, currentStepId: string, nextStepId: string | null) {
    if (!nextStepId) {
      // Complete the entire playbook
      const { error } = await supabase
        .from('action_sequences')
        .update({ status: 'COMPLETED', current_step_id: null })
        .eq('id', sequenceId);
        
      if (error) throw error;
      return { success: true, completed: true };
    } else {
      // Advance to next step
      const { error } = await supabase
        .from('action_sequences')
        .update({ current_step_id: nextStepId })
        .eq('id', sequenceId);
        
      if (error) throw error;
      return { success: true, completed: false };
    }
  }
}
