import { supabase } from "@/integrations/supabase/client";
import { DecisionEventService } from "./DecisionEventService";

export class DecisionMilestoneService {
  /**
   * Completes a required decision milestone.
   */
  static async completeMilestone(milestoneId: string, decisionProfileId: string) {
    const { data, error } = await supabase
      .from('decision_milestones')
      .update({ 
        status: 'COMPLETED', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    await DecisionEventService.logEvent(decisionProfileId, 'MILESTONE_COMPLETED', { 
      milestoneId, 
      milestoneName: data.milestone_name 
    });

    return data;
  }
}
