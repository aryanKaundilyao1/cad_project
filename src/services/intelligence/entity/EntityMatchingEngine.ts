export interface MatchResult {
  candidate_id: string;
  confidence: number;
  reasons: string[];
}

export class EntityMatchingEngine {
  /**
   * Evaluates an incoming entity against a list of candidates to generate confidence scores.
   */
  static calculateConfidence(incomingName: string, candidates: any[]): MatchResult[] {
    const results: MatchResult[] = [];
    const normalizedIncoming = incomingName.toLowerCase().trim();

    for (const candidate of candidates) {
      let confidence = 0;
      const reasons: string[] = [];
      const normalizedPrimary = (candidate.name || '').toLowerCase().trim();
      const normalizedAlias = (candidate.matched_alias || '').toLowerCase().trim();

      // 1. Exact Match Check
      if (normalizedIncoming === normalizedPrimary) {
        confidence = 100;
        reasons.push("Exact match on primary company name.");
      } else if (normalizedIncoming === normalizedAlias) {
        confidence = 100;
        reasons.push(`Exact match on known alias: ${candidate.matched_alias}`);
      } else {
        // 2. Substring/Fuzzy Heuristic Check (Simplified Levenshtein alternative for Phase 3C)
        // If the incoming string is a very close substring or vice versa
        if (normalizedPrimary.includes(normalizedIncoming) || normalizedIncoming.includes(normalizedPrimary)) {
          confidence = 80;
          reasons.push("High partial match (substring inclusion).");
        } else {
          // Base fallback for ILIKE matches that aren't exact
          confidence = 50;
          reasons.push("Loose text match.");
        }
      }

      results.push({
        candidate_id: candidate.id,
        confidence,
        reasons
      });
    }

    // Sort by confidence descending
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
