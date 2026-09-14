export class SizeMatchEngine {
  /**
   * Evaluates the size match score (0-6 points).
   * Combines revenue and headcount evaluation.
   */
  static evaluate(revenue: string | null, headcount: string | null, targetSize?: string): number {
    let score = 0;
    
    if (headcount) {
      // Basic heuristic: if it has employee count, 3 pts
      score += 3;
    }
    if (revenue) {
      // Basic heuristic: if it has revenue data, 3 pts
      score += 3;
    }
    
    // If we had specific target sizes (e.g. "Enterprise", "500-1000"), we would parse ranges here.
    return Math.min(score, 6);
  }
}
