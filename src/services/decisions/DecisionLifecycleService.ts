import { supabase } from "@/integrations/supabase/client";
import { DecisionEventService } from "./DecisionEventService";

export class DecisionLifecycleService {
  /**
   * Advances or regresses the decision to a new stage.
   */
  static async changeStage(decisionProfileId: string, newStageId: string) {
    const { data: stageInfo, error: stageError } = await supabase
      .from('decision_stages')
      .select('name')
      .eq('id', newStageId)
      .single();

    if (stageError) throw stageError;

    const { data, error } = await supabase
      .from('decision_profiles')
      .update({ current_stage_id: newStageId, updated_at: new Date().toISOString() })
      .eq('id', decisionProfileId)
      .select()
      .single();

    if (error) throw error;

    await DecisionEventService.logEvent(decisionProfileId, 'STAGE_CHANGED', { 
      newStageId, 
      stageName: stageInfo.name 
    });

    return data;
  }
}
