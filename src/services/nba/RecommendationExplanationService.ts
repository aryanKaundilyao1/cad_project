export class RecommendationExplanationService {
  /**
   * Generates a human readable explanation based on the driver and impacts.
   */
  static generateExplanation(action: string, driver: string, probabilityImpact: number) {
    let reasonText = "This action is recommended based on pipeline intelligence.";
    
    if (driver === 'MISSING_ROLE') {
      reasonText = "A critical stakeholder role (e.g. Economic Buyer) is currently missing from the committee map.";
    } else if (driver === 'STALLED_APPROVAL') {
      reasonText = "An approval in the chain has been stalled, increasing decision risk.";
    }

    return `Recommendation: ${action}\nReason: ${reasonText}\nExpected Impact: +${probabilityImpact}% Purchase Probability.`;
  }
}
