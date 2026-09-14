export class SearchIntentEngine {
  /**
   * Evaluates competitor comparison activity. Max 4 points.
   */
  static evaluate(competitorComparisonActivity: number): number {
    if (competitorComparisonActivity >= 3) return 4;
    if (competitorComparisonActivity > 0) return 2;
    return 0;
  }
}
