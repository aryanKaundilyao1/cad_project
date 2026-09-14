import { StakeholderProfile } from "../stakeholders/StakeholderTypes";

export class StakeholderRiskEngine {
  /**
   * Quantifies the individual risk a stakeholder poses to the deal.
   */
  static evaluate(profile: StakeholderProfile, isBlocked: boolean): { riskScore: number, evidence: string[] } {
    let riskScore = 0;
    const evidence: string[] = [];

    // Communication Risk (High influence, can't reach them)
    if (profile.influence_score > 60 && profile.accessibility_score < 20) {
      riskScore += 40;
      evidence.push(`High communication risk: High influence (${profile.influence_score}) but largely inaccessible (${profile.accessibility_score}).`);
    }

    // Sentiment Risk
    if (profile.sentiment_score < 0) {
      const penalty = Math.abs(profile.sentiment_score);
      riskScore += penalty;
      evidence.push(`Sentiment risk: Negative attitude detected (Score: ${profile.sentiment_score}).`);
    }

    // Structural Risk
    if (isBlocked) {
      riskScore += 30;
      evidence.push(`Structural risk: Stakeholder is positioned behind a BLOCKED_BY relationship edge.`);
    }

    riskScore = Math.min(riskScore, 100);

    return { riskScore, evidence };
  }
}
