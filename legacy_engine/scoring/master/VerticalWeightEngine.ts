export interface VerticalWeights {
  fit: number;
  intent: number;
  timing: number;
  engagement: number;
}

export class VerticalWeightEngine {
  /**
   * Returns pillar weights based on the target industry.
   * If not found, defaults to an even distribution (0.25 each) or standard B2B default.
   */
  static getWeights(industry: string | null, dbProfiles: any[] = []): VerticalWeights {
    const normalizedIndustry = (industry || '').toLowerCase();
    
    // Check if we have a DB profile first
    if (dbProfiles && dbProfiles.length > 0) {
      const match = dbProfiles.find(p => p.industry === normalizedIndustry && p.is_active);
      if (match) {
        return {
          fit: parseFloat(match.fit_weight),
          intent: parseFloat(match.intent_weight),
          timing: parseFloat(match.timing_weight),
          engagement: parseFloat(match.engagement_weight)
        };
      }
      
      const defaultMatch = dbProfiles.find(p => p.industry === 'default' && p.is_active);
      if (defaultMatch) {
        return {
          fit: parseFloat(defaultMatch.fit_weight),
          intent: parseFloat(defaultMatch.intent_weight),
          timing: parseFloat(defaultMatch.timing_weight),
          engagement: parseFloat(defaultMatch.engagement_weight)
        };
      }
    }

    // Hardcoded fallbacks if DB isn't seeded or available
    if (normalizedIndustry.includes('construction')) {
      return { fit: 0.20, intent: 0.20, timing: 0.40, engagement: 0.20 };
    }
    
    if (normalizedIndustry.includes('manufacturing')) {
      return { fit: 0.30, intent: 0.25, timing: 0.25, engagement: 0.20 };
    }
    
    if (normalizedIndustry.includes('procurement') || normalizedIndustry.includes('software')) {
      return { fit: 0.20, intent: 0.30, timing: 0.20, engagement: 0.30 };
    }
    
    if (normalizedIndustry.includes('export')) {
      return { fit: 0.25, intent: 0.20, timing: 0.35, engagement: 0.20 };
    }
    
    if (normalizedIndustry.includes('distribution')) {
      return { fit: 0.25, intent: 0.25, timing: 0.25, engagement: 0.25 };
    }
    
    // Default fallback
    return { fit: 0.25, intent: 0.30, timing: 0.25, engagement: 0.20 };
  }
}
