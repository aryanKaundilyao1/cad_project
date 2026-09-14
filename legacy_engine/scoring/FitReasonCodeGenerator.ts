export interface FitReasonCode {
  reason_type: string;
  reason_text: string;
  reason_category: 'Positive' | 'Neutral' | 'Negative';
  contribution_value: number;
}

export class FitReasonCodeGenerator {
  /**
   * Generates human-readable explanations based on the component scores.
   */
  static generate(
    industryScore: number,
    sizeScore: number,
    geoScore: number,
    techScore: number,
    finScore: number
  ): FitReasonCode[] {
    const reasons: FitReasonCode[] = [];

    // Industry
    if (industryScore >= 6) {
      reasons.push({ reason_type: 'industry', reason_text: 'Industry strongly aligned', reason_category: 'Positive', contribution_value: industryScore });
    } else if (industryScore > 0) {
      reasons.push({ reason_type: 'industry', reason_text: 'Generic industry match', reason_category: 'Neutral', contribution_value: industryScore });
    } else {
      reasons.push({ reason_type: 'industry', reason_text: 'Industry out of target ICP', reason_category: 'Negative', contribution_value: industryScore });
    }

    // Size
    if (sizeScore >= 6) {
      reasons.push({ reason_type: 'size', reason_text: 'Target employee and revenue range detected', reason_category: 'Positive', contribution_value: sizeScore });
    } else if (sizeScore > 0) {
      reasons.push({ reason_type: 'size', reason_text: 'Partial company size match', reason_category: 'Neutral', contribution_value: sizeScore });
    }

    // Geo
    if (geoScore >= 5) {
      reasons.push({ reason_type: 'geo', reason_text: 'Located in preferred geography', reason_category: 'Positive', contribution_value: geoScore });
    } else {
      reasons.push({ reason_type: 'geo', reason_text: 'Outside preferred geography', reason_category: 'Negative', contribution_value: geoScore });
    }

    // Tech
    if (techScore >= 5) {
      reasons.push({ reason_type: 'tech', reason_text: 'Technology stack strictly compatible', reason_category: 'Positive', contribution_value: techScore });
    } else if (techScore > 0) {
      reasons.push({ reason_type: 'tech', reason_text: 'Basic technology footprint present', reason_category: 'Neutral', contribution_value: techScore });
    }

    // Financial
    if (finScore >= 3) {
      reasons.push({ reason_type: 'financial', reason_text: 'Healthy business indicators present', reason_category: 'Positive', contribution_value: finScore });
    }

    return reasons;
  }
}
