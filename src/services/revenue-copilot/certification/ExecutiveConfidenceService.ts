import { supabase } from "@/integrations/supabase/client";

export class ExecutiveConfidenceService {
  /**
   * Mathematically scores the reliability of a generated executive output.
   * Based on snapshot freshness, citation coverage, and data completeness.
   */
  static async logConfidence(parentId: string, parentType: string, evidenceCoveragePercent: number, snapshotFreshnessMin: number) {
    // MOCK: Calculate a final 0-100 score
    let score = 100;
    if (evidenceCoveragePercent < 90) score -= 20;
    if (snapshotFreshnessMin > 60) score -= 10;

    await supabase.from('executive_confidence_logs').insert({
      parent_id: parentId,
      parent_type: parentType,
      confidence_score: score,
      evidence_coverage: evidenceCoveragePercent,
      snapshot_freshness_minutes: snapshotFreshnessMin
    });

    return score;
  }
}
