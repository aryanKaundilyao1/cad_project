export class PortfolioCompressionEngine {
  /**
   * Drops non-critical nested fields based on the required compression level 
   * (e.g. EXECUTIVE drops individual deal names, keeps only aggregate math).
   */
  static compress(contextPayload: any, level: 'EXECUTIVE' | 'MANAGEMENT' | 'OPERATIONAL') {
    const compressed = { ...contextPayload };
    
    if (level === 'EXECUTIVE') {
      // Keep only high-level aggregates
      delete compressed.pipeline.high_risk_deals_count; 
    }
    
    return compressed;
  }
}
