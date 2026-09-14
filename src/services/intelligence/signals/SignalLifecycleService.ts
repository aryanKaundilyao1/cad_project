import { SignalStatus } from './SignalEnums';
import { OpportunitySignal } from './SignalTypes';

export class SignalLifecycleService {
  /**
   * Validates if a state transition is legal.
   */
  static isValidTransition(current: SignalStatus, next: SignalStatus): boolean {
    const transitions: Record<SignalStatus, SignalStatus[]> = {
      [SignalStatus.DETECTED]: [SignalStatus.VALIDATED, SignalStatus.ARCHIVED],
      [SignalStatus.VALIDATED]: [SignalStatus.ACTIVE, SignalStatus.ARCHIVED],
      [SignalStatus.ACTIVE]: [SignalStatus.DECAYING, SignalStatus.EXPIRED, SignalStatus.ARCHIVED],
      [SignalStatus.DECAYING]: [SignalStatus.EXPIRED, SignalStatus.ARCHIVED],
      [SignalStatus.EXPIRED]: [SignalStatus.ARCHIVED],
      [SignalStatus.ARCHIVED]: [] // Terminal state
    };

    return transitions[current]?.includes(next) || false;
  }

  /**
   * Evaluates a signal to see if its lifecycle state needs updating based on timestamps.
   */
  static evaluateTimeBasedTransitions(signal: OpportunitySignal): SignalStatus {
    const now = new Date();
    
    // Check Expiration
    if (signal.expires_at && new Date(signal.expires_at) <= now) {
      if (signal.status === SignalStatus.ACTIVE || signal.status === SignalStatus.DECAYING) {
        return SignalStatus.EXPIRED;
      }
    }

    // Check Decay Start
    if (signal.decay_start && new Date(signal.decay_start) <= now) {
      if (signal.status === SignalStatus.ACTIVE) {
        return SignalStatus.DECAYING;
      }
    }

    return signal.status;
  }
}
