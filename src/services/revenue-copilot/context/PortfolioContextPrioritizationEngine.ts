export class PortfolioContextPrioritizationEngine {
  /**
   * Reorders the context package so the absolute highest risks are at the top,
   * guaranteeing the LLM reads them first.
   */
  static prioritize(contextPayload: any) {
    // MOCK: In reality, we'd sort based on severity scores.
    return {
      ...contextPayload,
      priority_focus: "FORECAST_RISK"
    };
  }
}
