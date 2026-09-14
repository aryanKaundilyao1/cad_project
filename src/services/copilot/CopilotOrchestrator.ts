import { supabase } from "@/integrations/supabase/client";
import { CopilotContextService } from "./CopilotContextService";
import { GroundingService } from "./GroundingService";

export class CopilotOrchestrator {
  /**
   * The main orchestrator for preparing a Copilot query.
   * Note: Phase 9A does not execute the actual LLM call, but sets up the strict pipeline.
   */
  static async prepareSessionContext(sessionId: string, opportunityId: string) {
    // 1. Generate Context Snapshot
    const contextSnapshot = await CopilotContextService.buildContextSnapshot(opportunityId);

    // 2. Persist Snapshot for Auditability
    const { data: snapshotRecord, error } = await supabase
      .from('copilot_context_snapshots')
      .insert({
        session_id: sessionId,
        opportunity_id: opportunityId,
        context_data: contextSnapshot
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      snapshotId: snapshotRecord.id,
      contextSnapshot
    };
  }

  /**
   * Post-LLM execution pipeline. Validates and audits the response.
   */
  static async processLlmResponse(sessionId: string, messageId: string, response: string, contextSnapshot: any) {
    // 1. Grounding Validation
    const validation = GroundingService.validateResponse(response, contextSnapshot);

    // 2. Audit Logging
    await supabase.from('copilot_audit_logs').insert({
      session_id: sessionId,
      message_id: messageId,
      action_type: validation.isValid ? 'RESPONSE_VALIDATED' : 'HALLUCINATION_DETECTED',
      details: {
        reason: validation.reason,
        raw_response: response
      }
    });

    if (!validation.isValid) {
      throw new Error(`Copilot response blocked by GroundingService: ${validation.reason}`);
    }

    return response;
  }
}
