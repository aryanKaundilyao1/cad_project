import { supabase } from "@/integrations/supabase/client";
import { ScoreExplanation } from "../ScoreExplanationService";
import { ScoreChangeEngine, ScoreChangeAnalysis } from "../history/ScoreChangeEngine";

export class OpportunityPersistenceService {
  /**
   * Persists the master score explainability payload to the database.
   * Tracks history and intelligence audit trails.
   */
  static async saveMasterScore(
    opportunityId: string,
    masterExplanation: ScoreExplanation,
    triggerSource: string
  ): Promise<void> {
    if (masterExplanation.score === "Not Calculable") {
      // Log failure but do not overwrite valid history with nulls
      await this.logAudit(opportunityId, triggerSource, null, null, "Insufficient Data");
      return;
    }

    const finalScore = masterExplanation.score as number;

    // 1. Fetch old score for delta and audit log
    const { data: oldScoreObj } = await supabase
      .from('opportunity_scores')
      .select('id, master_score')
      .eq('opportunity_id', opportunityId)
      .single();

    const oldScore = oldScoreObj ? oldScoreObj.master_score : null;

    // 2. Calculate Delta and Change Significance
    const changeAnalysis = ScoreChangeEngine.evaluateChange(oldScore || 0, finalScore);

    // 3. Extract sub-scores from factors for legacy compatibility
    const getFactorVal = (name: string) => masterExplanation.factors.find(f => f.name === name)?.value || null;
    const fitScore = getFactorVal("Fit Pillar");
    const intentScore = getFactorVal("Intent Pillar");
    const timingScore = getFactorVal("Timing Pillar");
    const engagementScore = getFactorVal("Engagement Pillar");

    // 4. Upsert Current Score in `opportunity_scores`
    let currentScoreId = oldScoreObj?.id;
    if (!currentScoreId) {
      const { data, error } = await supabase
        .from('opportunity_scores')
        .insert({
          opportunity_id: opportunityId,
          master_score: finalScore,
          fit_score: fitScore,
          intent_score: intentScore,
          timing_score: timingScore,
          engagement_score: engagementScore,
          factors: masterExplanation.factors,
          weights: masterExplanation.weights,
          evidence: masterExplanation.evidence,
          confidence: masterExplanation.confidence,
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
          master_score: finalScore,
          fit_score: fitScore,
          intent_score: intentScore,
          timing_score: timingScore,
          engagement_score: engagementScore,
          factors: masterExplanation.factors,
          weights: masterExplanation.weights,
          evidence: masterExplanation.evidence,
          confidence: masterExplanation.confidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentScoreId);
      if (error) throw error;
    }

    // 5. Insert Full History Record
    await supabase.from('opportunity_score_history').insert({
      opportunity_id: opportunityId,
      master_score: finalScore,
      fit_score: fitScore,
      intent_score: intentScore,
      timing_score: timingScore,
      engagement_score: engagementScore,
      delta: changeAnalysis.delta,
      factors: masterExplanation.factors,
      weights: masterExplanation.weights,
      evidence: masterExplanation.evidence,
      confidence: masterExplanation.confidence,
      trigger_source: triggerSource
    });

    // 6. Insert Intelligence Audit Log
    await this.logAudit(
      opportunityId,
      triggerSource,
      oldScore,
      finalScore,
      masterExplanation.confidence
    );

    // 7. Fire Alert if Significant (Stub for Phase 3D/Webhooks)
    if (changeAnalysis.significance === "Significant") {
      console.log(`[ALERT] Significant score change detected on Opp ${opportunityId}: ${changeAnalysis.direction} by ${Math.abs(changeAnalysis.delta)} points.`);
    }
  }

  private static async logAudit(
    opportunityId: string, 
    triggerEvent: string, 
    oldScore: number | null, 
    newScore: number | null, 
    confidenceStatus: string
  ): Promise<void> {
    await supabase.from('opportunity_intelligence_audit').insert({
      opportunity_id: opportunityId,
      trigger_event: triggerEvent,
      previous_score: oldScore,
      new_score: newScore,
      confidence_status: confidenceStatus
    });
  }
}
