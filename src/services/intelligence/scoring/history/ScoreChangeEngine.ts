export type ScoreChangeDirection = "Increased" | "Decreased" | "No Change";
export type ScoreChangeSignificance = "Significant" | "Normal" | "None";

export interface ScoreChangeAnalysis {
  delta: number;
  direction: ScoreChangeDirection;
  significance: ScoreChangeSignificance;
}

export class ScoreChangeEngine {
  /**
   * The threshold for a score change to be considered "Significant" (e.g., > 10 points).
   * This is used to trigger alerts in the UI or notify account executives.
   */
  static readonly SIGNIFICANCE_THRESHOLD = 10;

  /**
   * Calculates the delta and determines the direction and significance of a score change.
   */
  static evaluateChange(previousScore: number, newScore: number): ScoreChangeAnalysis {
    if (typeof previousScore !== "number" || typeof newScore !== "number") {
      return { delta: 0, direction: "No Change", significance: "None" };
    }

    const delta = Math.round((newScore - previousScore) * 100) / 100;
    
    let direction: ScoreChangeDirection = "No Change";
    if (delta > 0) direction = "Increased";
    else if (delta < 0) direction = "Decreased";

    let significance: ScoreChangeSignificance = "None";
    if (delta !== 0) {
      significance = Math.abs(delta) >= this.SIGNIFICANCE_THRESHOLD ? "Significant" : "Normal";
    }

    return {
      delta,
      direction,
      significance
    };
  }
}
