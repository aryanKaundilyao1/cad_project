import { OpportunitySignalService } from "./OpportunitySignalService";
import { SignalCategory, SignalConfidence, SignalSeverity, SignalStatus } from "./SignalEnums";
import { OpportunitySignal } from "./SignalTypes";
import { SignalDecayEngine } from "../scoring/master/SignalDecayEngine";

export interface ImpactEngineOutput {
  signalImpact: number;
  signals: string[];
  evidence: {
    id: string;
    type: string;
    weight: number;
    category: string;
  }[];
}

export class SignalImpactEngine {
  
  /**
   * Calculates the total numerical impact of all Active and Decaying signals for an Opportunity.
   * - Decaying signals have their impact reduced linearly.
   * - Confidence acts as a modifier (High=1.0, Medium=0.7, Low=0.3).
   */
  static calculateImpact(signals: OpportunitySignal[]): ImpactEngineOutput {
    const output: ImpactEngineOutput = {
      signalImpact: 0,
      signals: [],
      evidence: []
    };

    const now = new Date().getTime();

    for (const signal of signals) {
      // 1. Calculate Base Confidence Multiplier
      let confidenceMultiplier = 1.0;
      if (signal.confidence === SignalConfidence.MEDIUM) confidenceMultiplier = 0.7;
      if (signal.confidence === SignalConfidence.LOW) confidenceMultiplier = 0.3;
      if (signal.confidence === SignalConfidence.UNVERIFIED) confidenceMultiplier = 0.1;

      // 2. Calculate Decay Multiplier (Using Refactored SignalDecayEngine)
      const decayMultiplier = SignalDecayEngine.evaluate(signal, now);

      // 3. Final Weight Calculation
      const finalWeight = Number(signal.impact_score) * confidenceMultiplier * decayMultiplier;

      if (Math.abs(finalWeight) > 0.01) {
        output.signalImpact += finalWeight;
        
        const sign = finalWeight > 0 ? "+" : "";
        const formattedWeight = finalWeight.toFixed(1);
        
        output.signals.push(`${signal.signal_type} (${sign}${formattedWeight})`);
        
        output.evidence.push({
          id: signal.id,
          type: signal.signal_type,
          weight: Number(formattedWeight),
          category: signal.signal_category
        });
      }
    }

    // Round total to 2 decimal places
    output.signalImpact = Math.round(output.signalImpact * 100) / 100;
    
    return output;
  }
}
