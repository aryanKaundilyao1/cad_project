import { supabase } from "@/integrations/supabase/client";
import { StakeholderProfileService } from "../stakeholders/StakeholderProfileService";
import { ChampionDetectionEngine } from "./ChampionDetectionEngine";
import { BlockerDetectionEngine } from "./BlockerDetectionEngine";
import { StakeholderRiskEngine } from "./StakeholderRiskEngine";

export class StakeholderIntelligenceRecalculationService {
  /**
   * Evaluates and persists intelligence tags for a stakeholder.
   */
  static async recalculate(profileId: string) {
    // 1. Fetch Profile and latest Scores
    const { data: profileData, error: profileError } = await supabase
      .from('stakeholder_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profileData) throw profileError;

    // 2. Fetch Graph/Path context (hasPathToDecisionMaker)
    // For this blueprint, we mock the path check. In reality, we'd query relationship_insights
    const hasPathToDecisionMaker = true; 
    const isBlocked = false;

    // 3. Run Engines
    const championResult = ChampionDetectionEngine.evaluate(profileData as any, hasPathToDecisionMaker);
    const blockerResult = BlockerDetectionEngine.evaluate(profileData as any, hasPathToDecisionMaker);
    const riskResult = StakeholderRiskEngine.evaluate(profileData as any, isBlocked);

    // Default momentum for blueprint implementation
    const momentumState = 'STABLE'; 

    // Aggregate evidence
    const allEvidence = [
       ...championResult.evidence,
       ...blockerResult.evidence,
       ...riskResult.evidence
    ];

    const aggregateConfidence = Math.round((championResult.confidence + blockerResult.confidence) / 2);

    // 4. Persist
    await supabase.from('stakeholder_intelligence').insert({
      opportunity_id: profileData.opportunity_id,
      stakeholder_profile_id: profileId,
      champion_status: championResult.status,
      blocker_status: blockerResult.status,
      risk_score: riskResult.riskScore,
      momentum_state: momentumState,
      evidence: allEvidence,
      confidence_score: aggregateConfidence
    });

    // 5. Update Profile (Fast Read)
    await supabase.from('stakeholder_profiles').update({
      champion_status: championResult.status,
      blocker_status: blockerResult.status
    }).eq('id', profileId);
  }
}
