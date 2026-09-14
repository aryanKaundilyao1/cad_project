export type ScoreConfidence = "High Confidence" | "Medium Confidence" | "Low Confidence" | "Insufficient Data";

export interface ScoreFactor {
  name: string;
  value: number;
  max: number;
}

export interface ScoreWeight {
  pillar: string;
  weight_applied: number;
}

export interface ScoreExplanation {
  score: number | "Not Calculable";
  factors: ScoreFactor[];
  weights: ScoreWeight[];
  evidence: string[];
  confidence: ScoreConfidence;
  signals?: any[]; // Added for Phase 4B Signal Explainability
}

export class ScoreExplanationService {
  /**
   * Helper to format an explanation payload.
   */
  static buildExplanation(
    score: number | "Not Calculable",
    factors: ScoreFactor[],
    weights: ScoreWeight[],
    evidence: string[],
    confidence: ScoreConfidence,
    signals?: any[]
  ): ScoreExplanation {
    return {
      score,
      factors,
      weights,
      evidence,
      confidence,
      signals
    };
  }

  /**
   * Helper to determine confidence strictly based on data availability.
   * Customize for each pillar, but general rules apply:
   */
  static determineConfidence(missingCriticalCount: number, missingMinorCount: number): ScoreConfidence {
    if (missingCriticalCount >= 2) return "Insufficient Data";
    if (missingCriticalCount === 1) return "Low Confidence";
    if (missingMinorCount >= 2) return "Medium Confidence";
    return "High Confidence";
  }
}
