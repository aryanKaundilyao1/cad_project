import { supabase } from "@/integrations/supabase/client";

export class ExplainabilityCertificationService {
  /**
   * Scans the database to ensure absolutely zero intelligence scores exist
   * without natural language evidence. Defends against black-box logic.
   */
  static async validate(): Promise<boolean> {
    const { data: decScores, error: decErr } = await supabase
      .from('decision_scores')
      .select('id, evidence');
      
    if (decErr) throw decErr;
    
    for (const score of (decScores || [])) {
      if (!score.evidence || (Array.isArray(score.evidence) && score.evidence.length === 0)) {
        console.error(`Explainability Failure: decision_scores ID ${score.id} has no evidence.`);
        return false;
      }
    }

    const { data: appScores, error: appErr } = await supabase
      .from('approval_intelligence')
      .select('id, evidence');
      
    if (appErr) throw appErr;

    for (const score of (appScores || [])) {
      if (!score.evidence || (Array.isArray(score.evidence) && score.evidence.length === 0)) {
        console.error(`Explainability Failure: approval_intelligence ID ${score.id} has no evidence.`);
        return false;
      }
    }

    return true;
  }
}
