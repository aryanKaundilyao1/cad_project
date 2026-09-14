export class StakeholderIntelligenceExplanationService {
  /**
   * Formats detection output into human readable text for the UI.
   */
  static formatIntelligence(statusType: string, statusValue: string, confidence: number, evidence: string[]) {
    return {
      statusType, // e.g. "Champion Status"
      status: statusValue, // e.g. "CONFIRMED_CHAMPION"
      confidence: confidence,
      evidence: evidence // e.g. ["High structural influence", "Attended 5 meetings"]
    };
  }
}
