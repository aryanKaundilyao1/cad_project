import { StakeholderProfile } from "./StakeholderTypes";
import { ScoreResult } from "./StakeholderInfluenceEngine";

export class StakeholderPriorityEngine {
  /**
   * Synthesizes the four pillars into a single "Next Best Action" ranking.
   * Priority = (Influence * 0.4) + ((100 - Engagement) * 0.3) + (Accessibility * 0.3)
   * High influence + low engagement + high accessibility = TOP PRIORITY to reach out to.
   */
  static calculate(profile: StakeholderProfile): ScoreResult {
    const drivers = [];
    
    const influenceWeight = profile.influence_score * 0.40;
    const engagementGapWeight = (100 - profile.engagement_score) * 0.30;
    const accessibilityWeight = profile.accessibility_score * 0.30;

    const score = influenceWeight + engagementGapWeight + accessibilityWeight;

    drivers.push({ factor: 'Influence Weight', value: Math.round(influenceWeight), impact: 'Driven by their deal power' });
    drivers.push({ factor: 'Engagement Gap Weight', value: Math.round(engagementGapWeight), impact: 'Driven by lack of recent interaction' });
    drivers.push({ factor: 'Accessibility Weight', value: Math.round(accessibilityWeight), impact: 'Driven by ease of reaching them' });

    // Calculate a blended confidence
    // In a real system, we'd average the underlying confidences
    const confidence = 80;

    return { score: Math.round(score), confidence, drivers };
  }
}
