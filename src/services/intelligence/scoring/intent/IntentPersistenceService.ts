import { supabase } from "@/integrations/supabase/client";
import { IntentReasonCode } from "./IntentReasonCodeGenerator";

export class IntentPersistenceService {
  static async saveIntentScore(
    companyId: string,
    productId: string,
    newIntentScore: number,
    version: string,
    reasons: IntentReasonCode[],
    triggerSource: string
  ): Promise<void> {
    
    // 1. Fetch old score for audit log
    const { data: oldScoreObj } = await supabase
      .from('opportunity_scores')
      .select('id, intent_score, intent_version')
      .eq('company_id', companyId)
      .eq('product_id', productId)
      .single();

    // 2. Upsert Current Score (only update intent parts)
    let currentScoreId = oldScoreObj?.id;
    if (!currentScoreId) {
      // If no score exists at all, we create it
      const { data, error } = await supabase
        .from('opportunity_scores')
        .insert({
          company_id: companyId,
          product_id: productId,
          intent_score: newIntentScore,
          intent_version: version,
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
          intent_score: newIntentScore,
          intent_version: version,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentScoreId);
      if (error) throw error;
    }

    // 3. Insert History
    await supabase.from('intent_score_history').insert({
      company_id: companyId,
      product_id: productId,
      intent_score: newIntentScore,
      score_version: version
    });

    // 4. Update Reason Codes
    // First delete old intent reason codes for this score
    const intentReasonTypes = ['topic_surge', 'first_party', 'review_activity', 'search_intent', 'social_intent'];
    await supabase.from('score_reason_codes')
      .delete()
      .eq('score_id', currentScoreId)
      .in('reason_type', intentReasonTypes);
    
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
    await supabase.from('intent_audit_log').insert({
      company_id: companyId,
      product_id: productId,
      old_score: oldScoreObj ? { intent_score: oldScoreObj.intent_score, version: oldScoreObj.intent_version } : null,
      new_score: { intent_score: newIntentScore, version },
      change_reason: 'Recalculated',
      trigger_source: triggerSource
    });
  }
}
