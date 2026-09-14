import { OpportunitySignal } from "../../signals/SignalTypes";
import { SignalStatus } from "../../signals/SignalEnums";

export class SignalDecayEngine {
  /**
   * Refactored in Phase 4B.
   * Calculates the linear decay modifier for a single OpportunitySignal.
   * - ACTIVE signals return 1.0
   * - EXPIRED/ARCHIVED signals return 0.0
   * - DECAYING signals return a ratio between 1.0 and 0.0 based on elapsed time.
   */
  static evaluate(signal: OpportunitySignal, now: number = new Date().getTime()): number {
    if (signal.status === SignalStatus.ACTIVE) return 1.0;
    if (signal.status === SignalStatus.EXPIRED || signal.status === SignalStatus.ARCHIVED) return 0.0;
    
    if (signal.status === SignalStatus.DECAYING && signal.decay_start && signal.expires_at) {
      const decayStart = new Date(signal.decay_start).getTime();
      const expiresAt = new Date(signal.expires_at).getTime();
      const totalDecayTime = expiresAt - decayStart;
      
      if (totalDecayTime > 0 && now > decayStart) {
        const timeElapsedInDecay = now - decayStart;
        return Math.max(0, 1.0 - (timeElapsedInDecay / totalDecayTime));
      }
    }
    
    return 1.0; // Fallback
  }
}
