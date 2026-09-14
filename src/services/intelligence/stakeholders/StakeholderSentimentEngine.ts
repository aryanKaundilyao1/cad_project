import { OpportunitySignal } from "../signals/SignalTypes";
import { SignalDecayEngine } from "../scoring/master/SignalDecayEngine";
import { ScoreResult } from "./StakeholderInfluenceEngine";

export class StakeholderSentimentEngine {
  /**
   * Calculates sentiment driven purely by Phase 4 signals.
   * -100 to +100 range.
   */
  static calculate(signals: OpportunitySignal[], now: number = new Date().getTime()): ScoreResult {
    let score = 0; // Baseline neutral
    let confidence = 30; 
    const drivers = [];
    
    if (signals.length > 0) {
      confidence += Math.min(70, signals.length * 15);
      
      let positiveScore = 0;
      let negativeScore = 0;

      for (const signal of signals) {
        const decayMultiplier = SignalDecayEngine.evaluate(signal, now);
        const decayedImpact = Number(signal.impact_score) * decayMultiplier;

        if (decayedImpact > 0) {
          positiveScore += decayedImpact;
        } else if (decayedImpact < 0) {
          negativeScore += decayedImpact;
        }
      }

      score = positiveScore + negativeScore; // Net sentiment

      if (positiveScore > 0) drivers.push({ factor: 'Positive Signals', value: positiveScore, impact: 'Favorable interactions detected' });
      if (negativeScore < 0) drivers.push({ factor: 'Negative Signals', value: negativeScore, impact: 'Friction or risk detected' });
    } else {
      drivers.push({ factor: 'No Sentiment Data', value: 0, impact: 'Defaulting to neutral sentiment' });
    }

    score = Math.min(Math.max(score, -100), 100);
    return { score, confidence, drivers };
  }
}
