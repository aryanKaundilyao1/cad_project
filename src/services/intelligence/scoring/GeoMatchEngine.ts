export class GeoMatchEngine {
  /**
   * Evaluates geographic compatibility (0-5 points).
   */
  static evaluate(location: string | null, serviceableRegions?: string[]): number {
    if (!location) return 0;
    
    if (serviceableRegions && serviceableRegions.length > 0) {
      if (serviceableRegions.some(region => location.toLowerCase().includes(region.toLowerCase()))) {
        return 5;
      }
      return 0; // Out of region
    }
    
    // Fallback: 5 points if they have a known location and no specific limits exist.
    return 5;
  }
}
