import { OpportunitySignal } from "../signals/SignalTypes";
import { ScoreResult } from "../stakeholders/StakeholderInfluenceEngine";

export class RelationshipStrengthEngine {
  /**
   * Calculates dynamic edge strength based on shared signal activity.
   */
  static calculate(
    baseStrength: number = 5, 
    sharedSignals: OpportunitySignal[]
  ): ScoreResult {
    let strength = baseStrength;
    let confidence = 50;
    const drivers = [];

    if (sharedSignals.length > 0) {
      confidence += 30;
      
      const meetingSignals = sharedSignals.filter(s => s.signal_type.includes('MEETING'));
      const emailSignals = sharedSignals.filter(s => s.signal_type.includes('EMAIL'));

      if (meetingSignals.length > 0) {
        // Cap bump at +3
        const bump = Math.min(3, meetingSignals.length * 0.5);
        strength += bump;
        drivers.push({ factor: 'Shared Meetings', value: bump, impact: `Co-attended ${meetingSignals.length} meetings` });
      }

      if (emailSignals.length > 0) {
        // Cap bump at +2
        const bump = Math.min(2, emailSignals.length * 0.2);
        strength += bump;
        drivers.push({ factor: 'Shared Emails', value: bump, impact: `Co-recipient on ${emailSignals.length} emails` });
      }
    } else {
      drivers.push({ factor: 'No Shared Signals', value: 0, impact: 'Relying on baseline relationship strength' });
    }

    strength = Math.min(Math.max(Math.round(strength), 1), 10);
    
    return { score: strength, confidence, drivers };
  }
}
