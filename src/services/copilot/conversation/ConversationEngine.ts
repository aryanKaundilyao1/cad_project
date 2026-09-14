import { supabase } from "@/integrations/supabase/client";
import { IntentClassificationEngine } from "./IntentClassificationEngine";
import { ConversationMemoryEngine } from "./ConversationMemoryEngine";
import { CopilotExplanationEngine } from "./CopilotExplanationEngine";
import { CitationAwareResponseEngine } from "./CitationAwareResponseEngine";
import { ConversationValidationPipeline } from "./ConversationValidationPipeline";
import { ContextPackagingPipeline } from "../context/ContextPackagingPipeline";
import { CopilotOrchestrator } from "../CopilotOrchestrator";

export class ConversationEngine {
  /**
   * The master orchestrator for a Copilot Chat turn.
   */
  static async handleMessage(threadId: string, opportunityId: string, sessionId: string, userMessage: string) {
    // 1. Understand Intent
    const intent = IntentClassificationEngine.classifyIntent(userMessage);

    // 2. Fetch Memory
    const history = await ConversationMemoryEngine.getThreadHistory(threadId);

    // 3. Build & Save Context Package (from 9B)
    const packageId = await ContextPackagingPipeline.buildContextPackage(opportunityId, sessionId, intent);
    
    // 4. Fetch the Snapshot for prompt formatting (from 9A)
    const { contextSnapshot } = await CopilotOrchestrator.prepareSessionContext(sessionId, opportunityId);

    // AI Integration Disabled for Phase 2
    const disabledResponse = "AI services are currently disabled. Pending Gemini API integration.";

    // 8. Save User & Assistant Messages
    const { data: aiMsg } = await supabase.from('copilot_messages').insert({
      session_id: sessionId,
      thread_id: threadId,
      role: 'assistant',
      content: disabledResponse,
      intent_type: intent
    }).select('id').single();

    return disabledResponse;
  }
}
