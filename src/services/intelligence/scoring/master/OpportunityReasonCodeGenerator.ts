import { EngagementReasonCode } from "../engagement/EngagementReasonCodeGenerator";

export interface OpportunityReasonCode {
  reason_type: string;
  reason_text: string;
  reason_category: 'Positive' | 'Neutral' | 'Negative';
  contribution_value: number;
}

export class OpportunityReasonCodeGenerator {
  static generateDecayReason(decayFactor: number): OpportunityReasonCode | null {
    if (decayFactor >= 0.95) return null;
    
    let text = 'Score decayed slightly due to aging signals.';
    if (decayFactor < 0.5) text = 'Score heavily decayed due to lack of recent signal activity.';
    
    return {
      reason_type: 'decay_factor',
      reason_text: text,
      reason_category: 'Negative',
      contribution_value: decayFactor
    };
  }

  static generateNegativeReasons(negativeSignals: any[], daysSinceEngagement: number): OpportunityReasonCode[] {
    const reasons: OpportunityReasonCode[] = [];
    
    for (const sig of negativeSignals) {
      if (sig.type === 'competitor_signed') {
        reasons.push({ reason_type: 'negative_competitor', reason_text: 'Recently signed with a competitor', reason_category: 'Negative', contribution_value: 0.6 });
      }
      if (sig.type === 'layoffs') {
        reasons.push({ reason_type: 'negative_layoffs', reason_text: 'Recent hiring freeze or layoffs detected', reason_category: 'Negative', contribution_value: 0.75 });
      }
      if (sig.type === 'financial_distress') {
        reasons.push({ reason_type: 'negative_financial', reason_text: 'Financial distress indicators detected', reason_category: 'Negative', contribution_value: 0.8 });
      }
    }
    
    if (daysSinceEngagement > 180) {
      reasons.push({ reason_type: 'negative_engagement', reason_text: 'No engagement in over 180 days', reason_category: 'Negative', contribution_value: 0.85 });
    }
    
    return reasons;
  }
}
