export class RelationshipExplanationService {
  /**
   * Translates graph output and node path arrays into human readable text.
   */
  static formatPathExplanation(insightType: string, pathNames: string[], confidence: number, reason: string) {
    return {
      insight: insightType,
      path: pathNames, // e.g. ["John (Champion)", "Sarah (Procurement)", "Michael (CFO)"]
      confidence: confidence,
      reason: reason
    };
  }

  static formatNetworkRisk(riskType: string, description: string, affectedNames: string[]) {
    return {
      insight: `Network Risk: ${riskType}`,
      description: description,
      affected_stakeholders: affectedNames
    };
  }
}
