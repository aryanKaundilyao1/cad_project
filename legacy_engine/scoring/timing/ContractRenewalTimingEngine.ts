export class ContractRenewalTimingEngine {
  /**
   * ContractRenewalProximityScore
   * Max 3 points. 
   */
  static evaluate(contractRenewals: any[]): number {
    if (!contractRenewals || contractRenewals.length === 0) return 0;
    
    // Find closest upcoming renewal
    const upcoming = contractRenewals.filter(c => new Date(c.date) > new Date())
                                     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                     
    if (upcoming.length === 0) return 0; // Past renewals aren't actionable
    
    const daysUntil = (new Date(upcoming[0].date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    
    // If it's within 90 days, give full 3 points.
    if (daysUntil <= 90) return 3;
    
    // If it's within 180 days, give partial 1.5 points.
    if (daysUntil <= 180) return 1.5;

    return 0;
  }
}
