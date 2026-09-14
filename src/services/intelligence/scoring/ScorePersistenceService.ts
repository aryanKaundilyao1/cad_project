import { supabase } from "@/integrations/supabase/client";
import { FitReasonCode } from "./FitReasonCodeGenerator";

export class ScorePersistenceService {
  /**
   * Orchestrates the complex save operation for a new score calculation.
   * 1. Upserts `opportunity_scores`
   * 2. Inserts `opportunity_score_history`
   * 3. Replaces `score_reason_codes`
   * 4. Inserts `score_audit_log`
   */
  static async saveFitScore(
    companyId: string,
    productId: string | null,
    opportunityId: string | null,
    newFitScore: number,
    version: string,
    reasons: FitReasonCode[],
    triggerSource: string
  ): Promise<void> {
    
    // 1. Fetch old score for audit log
    let query = supabase
      .from('opportunity_scores')
      .select('fit_score, score_version')
      
    if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
    } else if (companyId && productId) {
        query = query.eq('company_id', companyId).eq('product_id', productId);
    } else {
        query = query.eq('company_id', companyId).is('product_id', null);
    }
      
    const { data: oldScoreObj } = await query.maybeSingle();

    // 2. Upsert Current Score
    // Note: upsert based on unique constraint will need to rely on the onConflict param
    // If opportunityId is present, we conflict on opportunity_id
    // Wait, Supabase upsert with partial unique indexes might be tricky.
    // We will do a select then update/insert
    
    let currentScore = null;
    let scoreErr = null;
    
    if (oldScoreObj) {
        // UPDATE
        let updateQuery = supabase.from('opportunity_scores').update({
            fit_score: newFitScore,
            score_version: version,
            calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        if (opportunityId) {
            updateQuery = updateQuery.eq('opportunity_id', opportunityId);
        } else if (productId) {
            updateQuery = updateQuery.eq('company_id', companyId).eq('product_id', productId);
        } else {
            updateQuery = updateQuery.eq('company_id', companyId).is('product_id', null);
        }
        
        const { data, error } = await updateQuery.select().single();
        currentScore = data;
        scoreErr = error;
    } else {
        // INSERT
        const { data, error } = await supabase.from('opportunity_scores').insert({
            company_id: companyId,
            product_id: productId,
            opportunity_id: opportunityId,
            fit_score: newFitScore,
            score_version: version,
            calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).select().single();
        currentScore = data;
        scoreErr = error;
    }

    if (scoreErr || !currentScore) {
      throw new Error(`Failed to save opportunity score: ${scoreErr?.message}`);
    }

    // 3. Insert History
    await supabase.from('opportunity_score_history').insert({
      company_id: companyId,
      product_id: productId,
      opportunity_id: opportunityId,
      fit_score: newFitScore,
      score_version: version
    });

    // 4. Update Reason Codes
    // First delete old reason codes for this score
    await supabase.from('score_reason_codes').delete().eq('score_id', currentScore.id);
    
    // Then insert new ones
    if (reasons.length > 0) {
      const reasonRows = reasons.map(r => ({
        score_id: currentScore.id,
        reason_type: r.reason_type,
        reason_text: r.reason_text,
        reason_category: r.reason_category,
        contribution_value: r.contribution_value
      }));
      await supabase.from('score_reason_codes').insert(reasonRows);
    }

    // 5. Insert Audit Log
    await supabase.from('score_audit_log').insert({
      company_id: companyId,
      product_id: productId,
      opportunity_id: opportunityId,
      old_score: oldScoreObj ? { fit_score: oldScoreObj.fit_score, version: oldScoreObj.score_version } : null,
      new_score: { fit_score: newFitScore, version },
      change_reason: 'Recalculated',
      trigger_source: triggerSource
    });
  }
}
