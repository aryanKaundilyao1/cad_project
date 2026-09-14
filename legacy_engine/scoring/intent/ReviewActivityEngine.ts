export class ReviewActivityEngine {
  /**
   * Evaluates review site activity (e.g. G2, Capterra). Max 5 points.
   */
  static evaluate(reviewSiteActivity: number): number {
    if (reviewSiteActivity >= 5) return 5;
    if (reviewSiteActivity >= 2) return 3;
    if (reviewSiteActivity > 0) return 1;
    return 0;
  }
}
