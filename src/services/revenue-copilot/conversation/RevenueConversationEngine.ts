import { RevenueIntentEngine } from "./RevenueIntentEngine";
import { RevenueMemoryEngine } from "./RevenueMemoryEngine";
import { PortfolioInsightEngine } from "./PortfolioInsightEngine";
import { RevenueExplanationEngine } from "./RevenueExplanationEngine";
import { RevenueStreamingEngine } from "./RevenueStreamingEngine";
import { RevenueCitationEngine } from "./RevenueCitationEngine";
import { RevenueMessageService } from "../RevenueMessageService";

export class RevenueConversationEngine {
  /**
   * The master orchestrator for Phase 10C.
   */
  static async handleQuestion(sessionId: string, threadId: string, snapshotId: string, contextPayload: any, question: string, onChunk: (chunk: string) => void) {
    // 1. Analyze Intent
    const intent = RevenueIntentEngine.analyzeIntent(question);

    // 2. Fetch Memory
    const memory = await RevenueMemoryEngine.getThreadMemory(threadId);

    // 3. Extract Insights
    const insights = PortfolioInsightEngine.extractInsights(contextPayload, intent);

    // 4. Build Prompt
    const prompt = RevenueExplanationEngine.buildPrompt(intent, insights, memory);

    // 5. MOCK: Execute LLM & Stream (with Validator implicitly inside)
    RevenueStreamingEngine.stream(prompt, contextPayload, onChunk);

    // 6. Save User Message
    await RevenueMessageService.addMessage(sessionId, snapshotId, 'user', question);

    // 7. Save Assistant Message & Citations
    const responseText = "Forecast confidence has declined because of delayed approvals.";
    const { id: messageId } = await RevenueMessageService.addMessage(sessionId, snapshotId, 'assistant', responseText);
    
    await RevenueCitationEngine.attachCitations(messageId, [
      { type: 'PORTFOLIO_METRIC', source_id: '1234', text: 'delayed approvals' }
    ]);
  }
}
