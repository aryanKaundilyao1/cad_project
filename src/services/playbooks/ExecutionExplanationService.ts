import { supabase } from "@/integrations/supabase/client";

export class ExecutionExplanationService {
  /**
   * Generates a narrative explaining why a playbook was triggered and its expected value.
   */
  static async explainTrigger(playbookId: string, triggerSource: string) {
    const { data: effectiveness } = await supabase
      .from('playbook_effectiveness')
      .select('*')
      .eq('playbook_id', playbookId)
      .maybeSingle();

    const { data: playbook } = await supabase
      .from('action_playbooks')
      .select('name')
      .eq('id', playbookId)
      .maybeSingle();

    let narrative = `The '${playbook?.name || 'Action'}' playbook was automatically activated based on intelligence from ${triggerSource}. `;
    
    if (effectiveness && effectiveness.success_rate > 0) {
      narrative += `Historically, executing this sequence has a ${effectiveness.success_rate}% success rate, improving win probability by an average of ${effectiveness.avg_probability_improvement}%.`;
    } else {
      narrative += `This is a newly deployed playbook sequence.`;
    }

    return narrative;
  }
}
