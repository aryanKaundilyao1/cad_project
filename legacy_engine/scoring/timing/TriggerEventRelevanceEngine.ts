export class TriggerEventRelevanceEngine {
  /**
   * TriggerEventRelevanceScore
   * Max 8 points. 
   * Uses recency to decay the score.
   */
  static evaluate(fundingEvents: any[], expansionEvents: any[], facilityOpenings: any[], permitActivity: any[]): number {
    const allEvents = [...(fundingEvents || []), ...(expansionEvents || []), ...(facilityOpenings || []), ...(permitActivity || [])];
    
    if (allEvents.length === 0) return 0;

    // Find the most recent event
    const sorted = allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const mostRecent = sorted[0];

    const daysSince = (new Date().getTime() - new Date(mostRecent.date).getTime()) / (1000 * 3600 * 24);
    
    // Decay: e^(-0.01 * days_since) (half-life ~70 days)
    const decayFactor = Math.exp(-0.01 * daysSince);
    
    // We assume CategoryMatchWeight is 1.0 for this blueprint.
    const raw = 8 * decayFactor;
    
    return Math.round(raw * 100) / 100;
  }
}
