import { StakeholderProfile } from "./StakeholderTypes";
import { ScoreResult } from "./StakeholderInfluenceEngine";

export class StakeholderAccessibilityEngine {
  /**
   * Calculates accessibility based on communication metadata.
   */
  static calculate(profile: StakeholderProfile): ScoreResult {
    let score = 50; // Default baseline
    let confidence = 20; 
    const drivers = [];
    
    const meta = profile.communication_metadata || {};
    
    // Evaluate Response Rate
    if (meta.response_rate !== undefined) {
      confidence += 40;
      const rate = Number(meta.response_rate); // e.g. 0.8 for 80%
      if (rate > 0.7) {
        score += 30;
        drivers.push({ factor: 'High Response Rate', value: 30, impact: `Replies ${Math.round(rate * 100)}% of the time` });
      } else if (rate < 0.3) {
        score -= 20;
        drivers.push({ factor: 'Low Response Rate', value: -20, impact: `Replies ${Math.round(rate * 100)}% of the time` });
      }
    }

    // Evaluate Meeting Attendance
    if (meta.meeting_attendance_rate !== undefined) {
      confidence += 40;
      const rate = Number(meta.meeting_attendance_rate);
      if (rate > 0.8) {
        score += 20;
        drivers.push({ factor: 'Reliable Attendance', value: 20, impact: `Attends ${Math.round(rate * 100)}% of meetings` });
      } else if (rate < 0.4) {
        score -= 20;
        drivers.push({ factor: 'Unreliable Attendance', value: -20, impact: `Attends ${Math.round(rate * 100)}% of meetings` });
      }
    }

    if (drivers.length === 0) {
      drivers.push({ factor: 'No Metadata', value: 0, impact: 'Insufficient communication history' });
    }

    score = Math.min(Math.max(score, 0), 100);
    return { score, confidence, drivers };
  }
}
