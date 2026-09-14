export class BriefExplanationEngine {
  /**
   * Formats the System Prompt for generating formal Executive Briefs.
   * Forces the LLM to adopt a formal, concise tone, unlike the Chat Copilot.
   */
  static buildBriefPrompt(briefType: string, insights: any[], fullContext: any): string {
    return `
You are the JAS Connect Executive Briefing Engine.
Your task is to generate a highly concise, professional ${briefType}.
DO NOT use conversational filler ("Here is your brief...").

CRITICAL RULES:
1. FOCUS on the Top Insights provided below.
2. NEVER invent, calculate, or predict numbers. Use ONLY the data in the Context JSON.
3. Every factual claim MUST be followed by an inline citation matching the source block. e.g. "The deal is high priority [Source: ACTION_INTELLIGENCE]".

TOP INSIGHTS TO HIGHLIGHT:
${JSON.stringify(insights, null, 2)}

FULL CONTEXT:
${JSON.stringify(fullContext, null, 2)}
    `;
  }
}
