import { StakeholderProfile } from "../stakeholders/StakeholderTypes";
import { IntelligenceResult } from "./ChampionDetectionEngine";

export class BlockerDetectionEngine {
  /**
   * Detects if a stakeholder is a blocker based on sentiment, engagement, and graph position.
   */
  static evaluate(
    profile: StakeholderProfile,
    hasPathToDecisionMaker: boolean = false
  ): IntelligenceResult {
    let status = 'NONE';
    const evidence: string[] = [];
    let confidence = 50;

    const { influence_score, engagement_score, sentiment_score } = profile;

    // Active block: Explicit negative sentiment
    if (sentiment_score < -10) {
      status = 'ACTIVE_BLOCKER';
      evidence.push(`Exhibits explicit negative sentiment (Score: ${sentiment_score}).`);
      confidence += 30;

      if (influence_score >= 60 && hasPathToDecisionMaker) {
         status = 'CONFIRMED_BLOCKER';
         evidence.push(`Possesses high influence and a verified path to the Decision Maker. High Risk.`);
         confidence += 10;
      }
    } 
    // Passive block: High influence but ghosting
    else if (influence_score >= 60 && engagement_score < 10) {
      status = 'PASSIVE_BLOCKER';
      evidence.push(`Highly influential (Score: ${influence_score}) but completely disengaged (Score: ${engagement_score}). Ghosting risk.`);
      confidence += 20;
    } 
    else {
      evidence.push(`No negative sentiment or significant passive risk detected.`);
    }

    return { status, confidence, evidence };
  }
}
