export interface IntentReasonCode {
  reason_type: string;
  reason_text: string;
  reason_category: 'Positive' | 'Neutral' | 'Negative';
  contribution_value: number;
}

export class IntentReasonCodeGenerator {
  static generate(
    surgeScore: number,
    firstPartyScore: number,
    reviewScore: number,
    searchScore: number,
    socialScore: number
  ): IntentReasonCode[] {
    const reasons: IntentReasonCode[] = [];

    if (surgeScore >= 8) {
      reasons.push({ reason_type: 'topic_surge', reason_text: 'Strong topic surge detected across multiple relevant categories', reason_category: 'Positive', contribution_value: surgeScore });
    } else if (surgeScore > 0) {
      reasons.push({ reason_type: 'topic_surge', reason_text: 'Moderate topic surge detected', reason_category: 'Neutral', contribution_value: surgeScore });
    }

    if (firstPartyScore >= 5) {
      reasons.push({ reason_type: 'first_party', reason_text: 'High engagement with pricing or demo requests', reason_category: 'Positive', contribution_value: firstPartyScore });
    } else if (firstPartyScore > 0) {
      reasons.push({ reason_type: 'first_party', reason_text: 'Basic website engagement', reason_category: 'Neutral', contribution_value: firstPartyScore });
    }

    if (reviewScore >= 3) {
      reasons.push({ reason_type: 'review_activity', reason_text: 'Active research on review platforms', reason_category: 'Positive', contribution_value: reviewScore });
    }

    if (searchScore >= 2) {
      reasons.push({ reason_type: 'search_intent', reason_text: 'Competitor comparison activity detected', reason_category: 'Positive', contribution_value: searchScore });
    }

    if (socialScore >= 1) {
      reasons.push({ reason_type: 'social_intent', reason_text: 'Engaging with social content', reason_category: 'Neutral', contribution_value: socialScore });
    }

    return reasons;
  }
}
