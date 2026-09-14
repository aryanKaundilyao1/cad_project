import { OpportunityScoringContext } from "../OpportunityScoringContext";
import { ScoreExplanationService, ScoreExplanation, ScoreFactor, ScoreWeight, ScoreConfidence } from "../ScoreExplanationService";
import { VerticalWeightEngine } from "./VerticalWeightEngine";
import { SignalDecayEngine } from "./SignalDecayEngine";
import { NegativeSignalEngine } from "./NegativeSignalEngine";
import { FitScoreService } from "../FitScoreService";
import { IntentScoreService } from "../intent/IntentScoreService";
import { TimingScoreService } from "../timing/TimingScoreService";
import { EngagementScoreService } from "../engagement/EngagementScoreService";
import { SignalImpactEngine } from "../../signals/SignalImpactEngine";

export class MasterOpportunityScoreEngine {
  static readonly CURRENT_VERSION = 'v2.0-master';

  /**
   * Calculates the overall Master Opportunity Score by orchestrating the sub-engines
   * and applying decay, vertical weights, and negative penalties.
   */
  static calculateMasterScore(context: OpportunityScoringContext): ScoreExplanation {
    const evidence: string[] = [];
    const factors: ScoreFactor[] = [];
    const appliedWeights: ScoreWeight[] = [];
    
    // 1. Calculate Pillars
    const fitEx = FitScoreService.calculateFitScore(context);
    const intentEx = IntentScoreService.calculateIntentScore(context);
    const timingEx = TimingScoreService.calculateTimingScore(context);
    const engEx = EngagementScoreService.calculateEngagementScore(context);

    // If Fit score is not calculable, log it but don't abort completely.
    if (fitEx.score === "Not Calculable") {
      evidence.push("Fit score was uncalculable. Falling back to 0.");
    }

    const fitScore = typeof fitEx.score === "number" ? fitEx.score : 0;
    const intentScore = typeof intentEx.score === "number" ? intentEx.score : 0;
    const timingScore = typeof timingEx.score === "number" ? timingEx.score : 0;
    const engScore = typeof engEx.score === "number" ? engEx.score : 0;

    // 2. Fetch Vertical Weights
    const industry = context.account?.industry || context.account?.inferred_industry || null;
    const weights = VerticalWeightEngine.getWeights(industry);
    
    appliedWeights.push({ pillar: "Fit", weight_applied: weights.fit });
    appliedWeights.push({ pillar: "Intent", weight_applied: weights.intent });
    appliedWeights.push({ pillar: "Timing", weight_applied: weights.timing });
    appliedWeights.push({ pillar: "Engagement", weight_applied: weights.engagement });

    evidence.push(`Applied vertical weights for industry: ${industry || 'Default'}`);

    // 3. Extract features for Decay and Penalties
    // Simplistic extraction based on context
    const daysSinceLastActivity = 5; // Placeholder logic based on activities
    
    // Note: SignalDecayEngine and NegativeSignalEngine are now natively handled via SignalImpactEngine,
    // but NegativeSignalEngine evaluates Risk multiplier.
    const negativeMultiplier = NegativeSignalEngine.evaluate(context.activeSignals || []);

    // 4. Master Formula
    // Base Score = [(Fit/25)*W_fit + (Intent/30)*W_intent + (Timing/25)*W_timing + (Engagement/20)*W_engage] * 100
    // Final Score = Base Score * NegativeMultiplier + SignalImpactEngine.signalImpact
    const weightedSum = (fitScore / 25) * weights.fit 
                      + (intentScore / 30) * weights.intent 
                      + (timingScore / 25) * weights.timing 
                      + (engScore / 20) * weights.engagement;
                      
    const rawWeighted = weightedSum * 100;
    
    const impactEngineResult = SignalImpactEngine.calculateImpact(context.activeSignals || []);
    
    const finalScoreRaw = (rawWeighted * negativeMultiplier) + impactEngineResult.signalImpact;
    // Cap strictly between 0 and 100
    const finalScoreCapped = Math.max(0, Math.min(100, finalScoreRaw));
    const finalScore = Math.round(finalScoreCapped * 100) / 100;

    // 5. Aggregate Factors & Evidence
    factors.push({ name: "Fit Pillar", value: fitScore, max: 25 });
    factors.push({ name: "Intent Pillar", value: intentScore, max: 30 });
    factors.push({ name: "Timing Pillar", value: timingScore, max: 25 });
    factors.push({ name: "Engagement Pillar", value: engScore, max: 20 });
    factors.push({ name: "Negative Multiplier", value: negativeMultiplier, max: 1 });
    factors.push({ name: "Signal Impact Modifiers", value: impactEngineResult.signalImpact, max: 100 });

    evidence.push(`Calculated raw weighted sum of ${Math.round(rawWeighted)} points.`);
    if (negativeMultiplier < 1) {
      evidence.push(`Applied Risk penalty multiplier of ${negativeMultiplier}.`);
    }
    if (impactEngineResult.evidence.length > 0) {
      impactEngineResult.evidence.forEach(ev => evidence.push(`Signal Impact: ${ev.type} (${ev.weight > 0 ? '+' : ''}${ev.weight})`));
    }

    // Determine Master Confidence based on Pillar confidences
    let masterConfidence: ScoreConfidence = "High Confidence";
    const confidences = [fitEx.confidence, intentEx.confidence, timingEx.confidence, engEx.confidence];
    
    if (confidences.includes("Insufficient Data")) {
       masterConfidence = "Insufficient Data";
    } else if (confidences.includes("Low Confidence")) {
       masterConfidence = "Low Confidence";
    } else if (confidences.includes("Medium Confidence")) {
       masterConfidence = "Medium Confidence";
    }

    return ScoreExplanationService.buildExplanation(
      finalScore,
      factors,
      appliedWeights,
      evidence,
      masterConfidence,
      impactEngineResult.signals
    );
  }
}
