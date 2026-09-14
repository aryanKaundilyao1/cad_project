import { StakeholderProfile } from "../stakeholders/StakeholderTypes";

export interface IntelligenceResult {
  status: string;
  confidence: number;
  evidence: string[];
}

export class ChampionDetectionEngine {
  /**
   * Detects if a stakeholder is a champion based on structural and signal math.
   * Requires inputs from Phase 5B (Scores) and Phase 5D (Graph).
   */
  static evaluate(
    profile: StakeholderProfile,
    hasPathToDecisionMaker: boolean = false
  ): IntelligenceResult {
    let status = 'NONE';
    const evidence: string[] = [];
    let confidence = 50;

    const { influence_score, engagement_score, sentiment_score } = profile;

    // Must have positive sentiment and some influence to even be considered
    if (influence_score >= 40 && sentiment_score > 10) {
      status = 'POTENTIAL_CHAMPION';
      evidence.push(`Exhibits positive sentiment (Score: ${sentiment_score}) and moderate influence (Score: ${influence_score}).`);
      confidence += 20;

      // Active Champion requires high engagement
      if (engagement_score >= 50) {
        status = 'ACTIVE_CHAMPION';
        evidence.push(`Highly engaged with recent signal activity (Score: ${engagement_score}).`);
        confidence += 10;

        // Confirmed Champion requires a verified graph path to power
        if (hasPathToDecisionMaker) {
          status = 'CONFIRMED_CHAMPION';
          evidence.push(`Verified structural path (INFLUENCES or REPORTS_TO) to the Decision Maker.`);
          confidence += 10;
          
          if (influence_score >= 80) {
             status = 'EXECUTIVE_CHAMPION';
             evidence.push(`Possesses executive-level influence.`);
          }
        } else {
          evidence.push(`Lacks a mapped structural path to the Decision Maker.`);
        }
      } else {
        evidence.push(`Engagement is currently too low to be considered active.`);
      }
    } else {
      evidence.push(`Does not meet base criteria (Influence > 40, Sentiment > +10).`);
    }

    return { status, confidence, evidence };
  }
}
