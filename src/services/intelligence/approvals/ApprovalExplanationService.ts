export class ApprovalExplanationService {
  /**
   * Translates the mathematical outputs into a human-readable JSON evidence array.
   */
  static formatEvidence(
    pathEvidence: string[],
    dependencyEvidence: string[],
    coverageEvidence: string[],
    riskEvidence: string[],
    readinessEvidence: string[],
    bottleneckEvidence: string[]
  ): string[] {
    return [
      ...pathEvidence,
      ...dependencyEvidence,
      ...coverageEvidence,
      ...riskEvidence,
      ...readinessEvidence,
      ...bottleneckEvidence
    ];
  }
}
