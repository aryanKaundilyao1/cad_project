export class RevenueExplanationEngine {
  /**
   * Constructs the strict system prompt that instructs the LLM how to explain 
   * the macro portfolio data without hallucinating numbers.
   */
  static buildPrompt(intent: string, insights: any, memory: any[]): string {
    return `
You are the Executive Revenue Copilot.
Your objective is to answer the user's question about their portfolio.

RULES:
1. You may ONLY reference the data provided in the Insights section.
2. DO NOT invent revenue, forecast, or pipeline numbers.
3. Keep the tone executive and concise.
4. Always provide an inline citation.

INSIGHTS:
${JSON.stringify(insights, null, 2)}

CHAT HISTORY:
${JSON.stringify(memory, null, 2)}
    `;
  }
}
