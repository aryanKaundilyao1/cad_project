export interface TimingReasonCode {
  reason_type: string;
  reason_text: string;
  reason_category: 'Positive' | 'Neutral' | 'Negative';
  contribution_value: number;
}

export class TimingReasonCodeGenerator {
  static generate(
    sourcingScore: number,
    triggerScore: number,
    hiringScore: number,
    contractScore: number
  ): TimingReasonCode[] {
    const reasons: TimingReasonCode[] = [];

    if (sourcingScore >= 10) {
      reasons.push({ reason_type: 'explicit_sourcing', reason_text: 'Active tender, RFP, or RFQ detected', reason_category: 'Positive', contribution_value: sourcingScore });
    }

    if (triggerScore >= 6) {
      reasons.push({ reason_type: 'trigger_event', reason_text: 'Highly relevant, recent business trigger event detected', reason_category: 'Positive', contribution_value: triggerScore });
    } else if (triggerScore > 0) {
      reasons.push({ reason_type: 'trigger_event', reason_text: 'Business trigger event detected (decayed due to age)', reason_category: 'Neutral', contribution_value: triggerScore });
    }

    if (hiringScore >= 4) {
      reasons.push({ reason_type: 'job_posting', reason_text: 'Relevant roles actively being hired', reason_category: 'Positive', contribution_value: hiringScore });
    }

    if (contractScore >= 3) {
      reasons.push({ reason_type: 'contract_renewal', reason_text: 'Incumbent contract renewal approaching within 90 days', reason_category: 'Positive', contribution_value: contractScore });
    } else if (contractScore > 0) {
      reasons.push({ reason_type: 'contract_renewal', reason_text: 'Incumbent contract renewal approaching within 180 days', reason_category: 'Neutral', contribution_value: contractScore });
    }

    return reasons;
  }
}
