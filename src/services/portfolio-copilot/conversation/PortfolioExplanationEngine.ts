export class PortfolioExplanationEngine {
  /**
   * Constructs the prompt forcing the LLM to explain graph connections naturally.
   */
  static buildPrompt(crossDomainContext: any, intent: string) {
    return `
      You are JAS CONNECT Portfolio Copilot.
      Explain the following cross-domain pattern strictly using the provided context.
      Context: ${JSON.stringify(crossDomainContext)}
      Intent: ${intent}
      Rule: You must cite every claim using [1], [2] format.
    `;
  }
}
