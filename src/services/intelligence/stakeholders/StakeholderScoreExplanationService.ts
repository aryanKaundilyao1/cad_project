import { ScoreResult } from "./StakeholderInfluenceEngine";

export class StakeholderScoreExplanationService {
  /**
   * Formats the raw JSONB drivers into a human-readable explanation payload.
   */
  static formatExplanation(scoreType: string, result: ScoreResult) {
    let summary = `Calculated ${scoreType} score of ${result.score}. `;
    
    if (result.drivers.length > 0) {
      summary += `Primary drivers include ${result.drivers.map(d => d.factor).join(', ')}.`;
    } else {
      summary += `No specific drivers detected. Default baseline applied.`;
    }

    return {
      score: result.score,
      confidence: result.confidence,
      explanation: summary,
      drivers: result.drivers
    };
  }
}
