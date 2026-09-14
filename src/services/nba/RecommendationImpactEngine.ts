export class RecommendationImpactEngine {
  /**
   * Translates a specific driver into a numeric probability and revenue impact.
   * This is entirely rule-based and avoids AI hallucinations.
   */
  static calculateImpact(driver: string, expectedRevenue: number) {
    let probabilityImpact = 0;
    
    switch(driver) {
      case 'MISSING_ROLE':
        probabilityImpact = 10; // Securing an Economic buyer typically boosts win likelihood by 10%
        break;
      case 'STALLED_APPROVAL':
        probabilityImpact = 15; // Unblocking approval boosts by 15%
        break;
      default:
        probabilityImpact = 5;
    }

    return {
      probabilityImpact,
      revenueImpact: expectedRevenue * (probabilityImpact / 100),
      riskReduction: probabilityImpact * 0.8 // Arbitrary safe rule
    };
  }
}
