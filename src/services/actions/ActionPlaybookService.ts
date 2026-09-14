import { supabase } from "@/integrations/supabase/client";

export class ActionPlaybookService {
  /**
   * Fetches an active playbook by its trigger type.
   */
  static async getPlaybookByTrigger(triggerType: string) {
    const { data, error } = await supabase
      .from('action_playbooks')
      .select('*, playbook_steps(*)')
      .eq('trigger_type', triggerType)
      .eq('status', 'ACTIVE')
      .order('step_order', { referencedTable: 'playbook_steps', ascending: true })
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
