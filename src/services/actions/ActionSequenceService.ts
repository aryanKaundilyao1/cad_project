import { supabase } from "@/integrations/supabase/client";

export class ActionSequenceService {
  /**
   * Initializes a new sequence for an opportunity based on a playbook.
   */
  static async startSequence(opportunityId: string, playbookId: string, firstStepId: string) {
    const { data, error } = await supabase
      .from('action_sequences')
      .insert({
        opportunity_id: opportunityId,
        playbook_id: playbookId,
        current_step_id: firstStepId,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
