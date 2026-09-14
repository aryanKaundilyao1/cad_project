export class DecisionExplanationService {
  /**
   * Translates the mathematical outputs into a human-readable JSON evidence array.
   */
  static formatEvidence(
    readinessEvidence: string[],
    riskEvidence: string[],
    momentumEvidence: string[],
    confidenceEvidence: string[]
  ): string[] {
    // In a real implementation this might structure it by category.
    // For now we aggregate them into a flat array of explainability strings.
    return [
      ...readinessEvidence,
      ...riskEvidence,
      ...momentumEvidence,
      ...confidenceEvidence
    ];
  }
}
