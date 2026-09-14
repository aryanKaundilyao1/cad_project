import { supabase } from "../integrations/supabase/client";
import type { LeadScoreResult } from "./types";

export class UserScorePersistenceService {
  /**
   * Saves or updates a computed OIE lead score in the database under user_lead_scores.
   */
  static async saveOIEScore(
    userId: string,
    result: LeadScoreResult
  ): Promise<void> {
    const scoreData = {
      user_id: userId,
      lead_id: result.lead_id,
      score_version: 'OIE_1.0',
      lead_score: result.lead_score,
      proc_score: result.proc_score,
      cont_score: result.cont_score,
      conf_score: result.conf_score,
      fit_score: result.fit_score,
      qual_score: result.qual_score,
      risk_score: result.risk_score,
      opp_score: result.opp_score,
      explanation: result.explanation,
      evidence_used: result.evidence_used,
      missing_evidence: [],
      updated_at: new Date().toISOString()
    };

    // Calculate all missing evidence across all metrics
    const missingEvidenceSet = new Set<string>();
    if (result.score_breakdown) {
      Object.values(result.score_breakdown).forEach((metric: any) => {
        if (metric && metric.missing_evidence) {
          metric.missing_evidence.forEach((e: string) => missingEvidenceSet.add(e));
        }
      });
    }
    scoreData.missing_evidence = Array.from(missingEvidenceSet) as any;

    const { error } = await supabase
      .from('user_lead_scores')
      .upsert(scoreData, {
        onConflict: 'user_id, lead_id, score_version',
      });

    if (error) {
      console.error('Failed to save user lead score:', error);
      throw new Error(`Failed to save user lead score: ${error.message}`);
    }
  }

  /**
   * Fetches a score for a specific user and lead.
   */
  static async getOIEScore(
    userId: string,
    leadId: string,
    scoreVersion: string = 'OIE_1.0'
  ) {
    const { data, error } = await supabase
      .from('user_lead_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('lead_id', leadId)
      .eq('score_version', scoreVersion)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user lead score:', error);
      throw new Error(`Failed to fetch user lead score: ${error.message}`);
    }

    return data;
  }
}
