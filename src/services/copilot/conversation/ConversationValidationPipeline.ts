import { GroundingService } from "../GroundingService";

export class ConversationValidationPipeline {
  /**
   * Final safety check before the LLM response is stored and shown to the user.
   * If this fails, the stream is aborted or a fallback message is shown.
   */
  static validate(llmResponse: string, contextSnapshot: any) {
    const groundingResult = GroundingService.validateResponse(llmResponse, contextSnapshot);
    
    if (!groundingResult.isValid) {
      console.error("Conversation Validation Failed: ", groundingResult.reason);
      throw new Error("HALLUCINATION_DETECTED");
    }

    return true;
  }
}
