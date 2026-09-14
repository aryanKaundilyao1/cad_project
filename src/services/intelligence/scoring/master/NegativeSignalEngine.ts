import { SignalSeverity } from "../../signals/SignalEnums";
import { OpportunitySignal } from "../../signals/SignalTypes";

export class NegativeSignalEngine {
  /**
   * Evaluates Risk signals and applies stacking multipliers.
   * - Critical Risk = -40% (0.60 multiplier)
   * - High Risk = -30% (0.70 multiplier)
   * - Medium Risk = -15% (0.85 multiplier)
   * - Low Risk = -5% (0.95 multiplier)
   * 
   * (multipliers stack multiplicatively, floor = 0.10)
   */
  static evaluate(activeSignals: OpportunitySignal[]): number {
    let multiplier = 1.0;
    
    // Filter to only Risk category signals that are active or decaying
    const riskSignals = activeSignals.filter(s => s.signal_category === 'Risk');
    
    for (const sig of riskSignals) {
      if (sig.severity === SignalSeverity.CRITICAL) multiplier *= 0.60;
      else if (sig.severity === SignalSeverity.HIGH) multiplier *= 0.70;
      else if (sig.severity === SignalSeverity.MEDIUM) multiplier *= 0.85;
      else if (sig.severity === SignalSeverity.LOW) multiplier *= 0.95;
    }
    
    return Math.max(0.10, multiplier);
  }
}
