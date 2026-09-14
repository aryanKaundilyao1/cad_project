import { supabase } from "@/integrations/supabase/client";
import { TimingReasonCode } from "./TimingReasonCodeGenerator";

export class TimingPersistenceService {
  static async saveTimingScore(
    companyId: string,
    productId: string,
    newTimingScore: number,
    version: string,
    reasons: TimingReasonCode[],
    triggerSource: string
  ): Promise<void> {
    
    // 1. Fetch old score for audit log
    const { data: oldScoreObj } = await supabase
      .from('opportunity_scores')
      .select('id, timing_score, timing_version')
      .eq('company_id', companyId)
      .eq('product_id', productId)
      .single();

    // 2. Upsert Current Score (only update timing parts)
    let currentScoreId = oldScoreObj?.id;
    if (!currentScoreId) {
      const { data, error } = await supabase
        .from('opportunity_scores')
        .insert({
          company_id: companyId,
          product_id: productId,
          timing_score: newTimingScore,
          timing_version: version,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      currentScoreId = data.id;
    } else {
      const { error } = await supabase
        .from('opportunity_scores')
        .update({
          timing_score: newTimingScore,
          timing_version: version,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentScoreId);
      if (error) throw error;
    }

    // 3. Insert History
    await supabase.from('timing_score_history').insert({
      company_id: companyId,
      product_id: productId,
      timing_score: newTimingScore,
      score_version: version
    });

    // 4. Update Reason Codes
    // First delete old timing reason codes for this score
    const timingReasonTypes = ['explicit_sourcing', 'trigger_event', 'job_posting', 'contract_renewal'];
    await supabase.from('score_reason_codes')
      .delete()
      .eq('score_id', currentScoreId)
      .in('reason_type', timingReasonTypes);
    
    // Then insert new ones
    if (reasons.length > 0) {
      const reasonRows = reasons.map(r => ({
        score_id: currentScoreId,
        reason_type: r.reason_type,
        reason_text: r.reason_text,
        reason_category: r.reason_category,
        contribution_value: r.contribution_value
      }));
      await supabase.from('score_reason_codes').insert(reasonRows);
    }

    // 5. Insert Audit Log
    await supabase.from('timing_audit_log').insert({
      company_id: companyId,
      product_id: productId,
      old_score: oldScoreObj ? { timing_score: oldScoreObj.timing_score, version: oldScoreObj.timing_version } : null,
      new_score: { timing_score: newTimingScore, version },
      change_reason: 'Recalculated',
      trigger_source: triggerSource
    });
  }
}
