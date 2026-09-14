import { supabase } from "@/integrations/supabase/client";

export class DecisionEventService {
  /**
   * Logs an immutable event to the decision ledger.
   * This provides the foundation for Phase 7 prediction models.
   */
  static async logEvent(
    decisionProfileId: string, 
    eventType: 'DECISION_CREATED' | 'STAGE_CHANGED' | 'MILESTONE_COMPLETED' | 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'APPROVAL_REJECTED' | 'DECISION_CLOSED', 
    payload: any
  ) {
    const { error } = await supabase
      .from('decision_events')
      .insert({
        decision_profile_id: decisionProfileId,
        event_type: eventType,
        payload: payload
      });

    if (error) {
      console.error("Failed to log decision event:", error);
      throw error;
    }
  }
}
