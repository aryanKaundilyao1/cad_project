import { CrossDomainIntentEngine } from "./CrossDomainIntentEngine";
import { PortfolioResponseValidator } from "./PortfolioResponseValidator";
import { PortfolioStreamingEngine } from "./PortfolioStreamingEngine";

export class PortfolioConversationEngine {
  /**
   * Master orchestrator for cross-domain chat.
   */
  static async chat(threadId: string, packageId: string, userMessage: string) {
    // 1. Detect Intent (e.g. is this a Signal -> Revenue question?)
    const intent = CrossDomainIntentEngine.detectIntent(userMessage);

    // 2. Mock: stream generation
    const mockResponseStream = ["Forecast confidence ", "has decreased ", "due to ", "approval delays [1]."];

    // 3. Stream back to client, passing through the mathematical response validator
    PortfolioStreamingEngine.stream(mockResponseStream, packageId, PortfolioResponseValidator.validateChunk);
  }
}
