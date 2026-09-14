import { OpportunitySignal } from "./SignalTypes";
import { SignalPriority } from "./SignalPriorityEngine";

export enum SignalUrgency {
  IMMEDIATE_ACTION = "Immediate Action",
  TODAY = "Today",
  THIS_WEEK = "This Week",
  MONITOR = "Monitor"
}

export class SignalUrgencyEngine {
  /**
   * Determines time-sensitivity of a signal independently of its magnitude.
   * e.g., A low-impact signal that expires in 12 hours is highly urgent.
   */
  static determineUrgency(
    signal: OpportunitySignal,
    priority: SignalPriority,
    now: number = new Date().getTime()
  ): SignalUrgency {
    
    // Default Urgency
    let urgency = SignalUrgency.MONITOR;

    // 1. Explicit Expiration Proximity
    if (signal.expires_at) {
      const expiresAt = new Date(signal.expires_at).getTime();
      const hoursUntilExpiration = (expiresAt - now) / (1000 * 60 * 60);

      if (hoursUntilExpiration > 0) {
        if (hoursUntilExpiration <= 24) return SignalUrgency.IMMEDIATE_ACTION;
        if (hoursUntilExpiration <= 48) return SignalUrgency.TODAY;
        if (hoursUntilExpiration <= 168) return SignalUrgency.THIS_WEEK; // 7 days
      }
    }

    // 2. Priority Upgrades
    // Critical Priority signals ALWAYS demand at least TODAY urgency
    if (priority === SignalPriority.CRITICAL && urgency === SignalUrgency.MONITOR) {
      urgency = SignalUrgency.TODAY;
    }

    // 3. Category Heuristics
    // Actionable categories inherently drive higher urgency
    if (signal.signal_category === 'Risk' && priority === SignalPriority.HIGH) {
      urgency = SignalUrgency.IMMEDIATE_ACTION;
    }

    return urgency;
  }
}
