import { OpportunitySignal } from "./SignalTypes";
import { SignalConfidence } from "./SignalEnums";
import { SignalDecayEngine } from "../scoring/master/SignalDecayEngine";

export enum SignalPriority {
  CRITICAL = "Critical",
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low"
}

export class SignalPriorityEngine {
  /**
   * Dynamically calculates priority based on:
   * 1. Absolute Impact Score
   * 2. Confidence Level
   * 3. Recency (Decay)
   * 4. Master Opportunity Score Context
   * 
   * A +5 signal on an opp with a score of 85 is Critical.
   * A +5 signal on an opp with a score of 30 is Medium.
   */
  static calculatePriority(
    signal: OpportunitySignal, 
    masterOpportunityScore: number,
    now: number = new Date().getTime()
  ): SignalPriority {
    
    // 1. Base Impact Magnitude
    const impactMagnitude = Math.abs(Number(signal.impact_score));
    
    // 2. Confidence Modifier
    let confidenceMultiplier = 1.0;
    if (signal.confidence === SignalConfidence.MEDIUM) confidenceMultiplier = 0.8;
    if (signal.confidence === SignalConfidence.LOW) confidenceMultiplier = 0.5;
    if (signal.confidence === SignalConfidence.UNVERIFIED) confidenceMultiplier = 0.2;

    // 3. Recency Modifier (Using existing Decay Engine)
    const decayMultiplier = SignalDecayEngine.evaluate(signal, now);

    // 4. Contextual Modifier (How close to closing is this?)
    // If score > 80, signals matter more. If score < 40, they matter less.
    let contextMultiplier = 1.0;
    
    // Only apply extreme contextual escalation if the base impact is meaningful (e.g. > 2)
    // This prevents a minor +0.5 "email sent" from becoming a CRITICAL signal just because the deal is at 90.
    if (impactMagnitude >= 2.0) {
      if (masterOpportunityScore >= 80) contextMultiplier = 1.5;
      else if (masterOpportunityScore >= 60) contextMultiplier = 1.2;
      else if (masterOpportunityScore < 40) contextMultiplier = 0.8;
    }

    // Final Weighted Priority Score
    const weightedPriority = impactMagnitude * confidenceMultiplier * decayMultiplier * contextMultiplier;

    if (weightedPriority >= 15) return SignalPriority.CRITICAL;
    if (weightedPriority >= 8) return SignalPriority.HIGH;
    if (weightedPriority >= 3) return SignalPriority.MEDIUM;
    return SignalPriority.LOW;
  }
}
