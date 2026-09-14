import { supabase } from "../integrations/supabase/client";
import type { LeadScoreResult } from "./types";

export class OIEPersistenceService {
  /**
   * Saves or updates a computed OIE lead score and its full metrics breakdown
   * in the database under opportunity_scores.
   */
  static async saveOIEScore(
    companyId: string,
    productId: string | null,
    opportunityId: string | null,
    result: LeadScoreResult,
    triggerSource: string
  ): Promise<void> {
    
    // 1. Check if old score exists
    let query = supabase
      .from('opportunity_scores')
      .select('id, lead_score, fit_score, score_version');
      
    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    } else if (companyId && productId) {
      query = query.eq('company_id', companyId).eq('product_id', productId);
    } else {
      query = query.eq('company_id', companyId).is('product_id', null);
    }
      
    const { data: oldScoreObj } = await query.maybeSingle();

    // 2. Prepare score data object
    const scoreData = {
      lead_score: result.lead_score,
      proc_score: result.proc_score,
      cont_score: result.cont_score,
      conf_score: result.conf_score,
      fit_score: result.fit_score,
      qual_score: result.qual_score,
      risk_score: result.risk_score,
      opp_score: result.opp_score,
      opp_bucket: result.opp_bucket,
      score_breakdown: result.score_breakdown,
      score_version: result.score_version,
      pipeline_timestamp: result.pipeline_timestamp,
      source_used: result.source_used,
      evidence_used: result.evidence_used,
      outreach_eligible: result.outreach_eligible,
      qual_passed: result.qual_passed,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let currentScore = null;
    let scoreErr = null;
    
    if (oldScoreObj) {
      // UPDATE
      let updateQuery = supabase
        .from('opportunity_scores')
        .update(scoreData);
        
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
      const insertData = {
        company_id: companyId,
        product_id: productId,
        opportunity_id: opportunityId,
        ...scoreData
      };
      
      const { data, error } = await supabase
        .from('opportunity_scores')
        .insert(insertData)
        .select()
        .single();
      currentScore = data;
      scoreErr = error;
    }

    if (scoreErr || !currentScore) {
      throw new Error(`Failed to save OIE opportunity score: ${scoreErr?.message}`);
    }

    // 3. Insert History record
    try {
      await supabase.from('opportunity_score_history').insert({
        company_id: companyId,
        product_id: productId,
        opportunity_id: opportunityId,
        fit_score: result.fit_score ?? 0,
        score_version: result.score_version
      });
    } catch (e) {
      console.warn('Failed inserting to opportunity_score_history:', e);
    }

    // 4. Update Reason Codes
    try {
      // Delete old reason codes
      await supabase.from('score_reason_codes').delete().eq('score_id', currentScore.id);
      
      // Build reason codes from score breakdown metrics
      const reasons = [];
      const sb = result.score_breakdown;
      
      if (sb.proc) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'procurement',
          reason_text: sb.proc.reason,
          reason_category: 'PROC',
          contribution_value: sb.proc.score
        });
      }
      if (sb.cont) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'contactability',
          reason_text: sb.cont.reason,
          reason_category: 'CONT',
          contribution_value: sb.cont.score
        });
      }
      if (sb.conf) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'confidence',
          reason_text: sb.conf.reason,
          reason_category: 'CONF',
          contribution_value: sb.conf.score
        });
      }
      if (sb.fit) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'fit',
          reason_text: sb.fit.reason,
          reason_category: 'FIT',
          contribution_value: sb.fit.score ?? 0
        });
      }
      if (sb.risk) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'risk',
          reason_text: sb.risk.reason,
          reason_category: 'RISK',
          contribution_value: sb.risk.score
        });
      }
      if (sb.opp) {
        reasons.push({
          score_id: currentScore.id,
          reason_type: 'opportunity',
          reason_text: sb.opp.reason,
          reason_category: 'OPP',
          contribution_value: sb.opp.score
        });
      }
      
      if (reasons.length > 0) {
        await supabase.from('score_reason_codes').insert(reasons);
      }
    } catch (e) {
      console.warn('Failed replacing score_reason_codes:', e);
    }

    // 5. Insert Audit Log
    try {
      await supabase.from('score_audit_log').insert({
        company_id: companyId,
        product_id: productId,
        opportunity_id: opportunityId,
        old_score: oldScoreObj ? { fit_score: oldScoreObj.fit_score, version: oldScoreObj.score_version } : null,
        new_score: { lead_score: result.lead_score, version: result.score_version },
        change_reason: 'OIE Engine Calculation',
        trigger_source: triggerSource
      });
    } catch (e) {
      console.warn('Failed inserting to score_audit_log:', e);
    }
  }
}
