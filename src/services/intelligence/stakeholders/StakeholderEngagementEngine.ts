import { OpportunitySignal } from "../signals/SignalTypes";
import { SignalDecayEngine } from "../scoring/master/SignalDecayEngine";
import { ScoreResult } from "./StakeholderInfluenceEngine";

export class StakeholderEngagementEngine {
  /**
   * Calculates engagement driven purely by Phase 4 signals.
   * Decays over time if the stakeholder goes dark.
   */
  static calculate(signals: OpportunitySignal[], now: number = new Date().getTime()): ScoreResult {
    let score = 0;
    let confidence = 40; // Base confidence
    const drivers = [];
    
    if (signals.length > 0) {
      confidence += Math.min(60, signals.length * 10);
      
      let meetingScore = 0;
      let responseScore = 0;
      let otherScore = 0;

      for (const signal of signals) {
        // Apply decay to each signal's base impact
        const decayMultiplier = SignalDecayEngine.evaluate(signal, now);
        const decayedImpact = Number(signal.impact_score) * decayMultiplier;

        if (decayedImpact <= 0) continue; // Only positive engagement counts here

        if (signal.signal_type.includes('MEETING')) {
          meetingScore += decayedImpact;
        } else if (signal.signal_type.includes('RESPONSE') || signal.signal_type.includes('REPLY')) {
          responseScore += decayedImpact;
        } else {
          otherScore += decayedImpact;
        }
      }

      // Cap category scores to prevent one meeting spam from maxing engagement
      meetingScore = Math.min(meetingScore, 60);
      responseScore = Math.min(responseScore, 30);
      otherScore = Math.min(otherScore, 20);

      score = meetingScore + responseScore + otherScore;

      if (meetingScore > 0) drivers.push({ factor: 'Meeting Engagement', value: meetingScore, impact: 'Direct interaction via meetings' });
      if (responseScore > 0) drivers.push({ factor: 'Response Engagement', value: responseScore, impact: 'Active email/message responses' });
      if (otherScore > 0) drivers.push({ factor: 'Other Engagement', value: otherScore, impact: 'Document views or task completion' });
    } else {
      drivers.push({ factor: 'No Engagement', value: 0, impact: 'No active signals found' });
    }

    score = Math.min(Math.max(score, 0), 100);
    return { score, confidence, drivers };
  }
}
