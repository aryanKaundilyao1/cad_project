export class SocialIntentEngine {
  /**
   * Evaluates social engagement (LinkedIn, etc). Max 3 points.
   */
  static evaluate(socialEngagement: number): number {
    if (socialEngagement >= 5) return 3;
    if (socialEngagement > 0) return 1;
    return 0;
  }
}
