import { COIFResult } from './types';

export class RankingEngine {
  public static rank(results: COIFResult[]): COIFResult[] {
    // 1. Primary Sort: Final Score (Descending)
    // 2. Secondary Sort: Confidence (Descending)
    return results.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return b.confidenceScore - a.confidenceScore;
    });
  }
}
