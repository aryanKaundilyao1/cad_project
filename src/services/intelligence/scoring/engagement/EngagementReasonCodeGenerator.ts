export interface EngagementReasonCode {
  reason_type: string;
  reason_text: string;
  reason_category: 'Positive' | 'Neutral' | 'Negative';
  contribution_value: number;
}

export class EngagementReasonCodeGenerator {
  static generate(
    countScore: number,
    seniorityScore: number,
    contactCount: number
  ): EngagementReasonCode[] {
    const reasons: EngagementReasonCode[] = [];

    if (countScore >= 14) {
      reasons.push({ reason_type: 'stakeholder_count', reason_text: `Broad buying committee detected (${contactCount} stakeholders)`, reason_category: 'Positive', contribution_value: countScore });
    } else if (countScore > 0) {
      reasons.push({ reason_type: 'stakeholder_count', reason_text: `Single or dual stakeholder engagement (${contactCount} engaged)`, reason_category: 'Neutral', contribution_value: countScore });
    }

    if (seniorityScore >= 5) {
      reasons.push({ reason_type: 'stakeholder_seniority', reason_text: 'High C-level/VP executive involvement', reason_category: 'Positive', contribution_value: seniorityScore });
    } else if (seniorityScore >= 3) {
      reasons.push({ reason_type: 'stakeholder_seniority', reason_text: 'Management/Director level involvement', reason_category: 'Positive', contribution_value: seniorityScore });
    } else if (seniorityScore > 0) {
      reasons.push({ reason_type: 'stakeholder_seniority', reason_text: 'Individual contributor involvement', reason_category: 'Neutral', contribution_value: seniorityScore });
    }

    return reasons;
  }
}
