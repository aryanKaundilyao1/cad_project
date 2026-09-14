export class FirstPartyIntentEngine {
  /**
   * Evaluates pricing visits, demo requests, spec downloads. Max 8 points.
   */
  static evaluate(pricingVisits: number, demoRequests: number, specDownloads: number): number {
    let score = 0;
    
    // Demo request is high intent
    if (demoRequests > 0) score += 5;
    
    // Pricing visits
    if (pricingVisits > 2) score += 2;
    else if (pricingVisits > 0) score += 1;

    // Spec downloads
    if (specDownloads > 0) score += 1;

    return Math.min(score, 8);
  }
}
