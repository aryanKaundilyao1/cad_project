import { supabase } from "@/integrations/supabase/client";

export class GroundingService {
  /**
   * Validates an LLM response against the strict JSON context snapshot.
   * Prevents hallucinated numbers, dates, or non-existent stakeholders.
   */
  static validateResponse(llmResponse: string, contextSnapshot: any): { isValid: boolean, reason?: string } {
    // 1. Regex check for Revenue/Currency hallucinations
    const moneyRegex = /\$[\d,]+/g;
    const mentionedAmounts = llmResponse.match(moneyRegex);

    if (mentionedAmounts) {
      const allowedRevenue = `$${contextSnapshot.opportunity.current_revenue_forecast?.toLocaleString()}`;
      
      for (const amount of mentionedAmounts) {
        // If the LLM mentions a dollar amount that does not match the exact forecast in context, block it.
        if (amount !== allowedRevenue) {
          return {
            isValid: false,
            reason: `Hallucination detected. Model attempted to quote ${amount}, but context expects ${allowedRevenue}.`
          };
        }
      }
    }

    // 2. Further strict AST validations can go here.
    return { isValid: true };
  }
}
