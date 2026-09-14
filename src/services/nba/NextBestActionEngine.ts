import { supabase } from "@/integrations/supabase/client";
import { StakeholderRecommendationEngine } from "./StakeholderRecommendationEngine";
import { ApprovalRecommendationEngine } from "./ApprovalRecommendationEngine";
import { RecommendationImpactEngine } from "./RecommendationImpactEngine";
import { RecommendationExplanationService } from "./RecommendationExplanationService";

export class NextBestActionEngine {
  /**
   * Main pipeline to generate, score, and persist recommendations.
   */
  static async generateRecommendations(opportunityId: string) {
    const allRecs = [];
    
    // 1. Run detection engines
    const stakeholderRecs = await StakeholderRecommendationEngine.evaluate(opportunityId);
    const approvalRecs = await ApprovalRecommendationEngine.evaluate(opportunityId);
    
    allRecs.push(...stakeholderRecs, ...approvalRecs);
    
    // 2. Fetch baseline data for impact scoring
    const { data: forecast } = await supabase
      .from('forecast_scenarios')
      .select('expected_case_amount')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();
      
    const expectedRevenue = forecast?.expected_case_amount ?? 100000;

    // 3. Score, Explain, and Persist
    for (const rec of allRecs) {
      // Calculate impact
      const impact = RecommendationImpactEngine.calculateImpact(rec.driver, expectedRevenue);
      
      // Generate explanation
      const explanation = RecommendationExplanationService.generateExplanation(rec.action, rec.driver, impact.probabilityImpact);
      
      // Save recommendation
      const { data: savedRec } = await supabase
        .from('action_recommendations')
        .insert({
          opportunity_id: opportunityId,
          recommendation_type: rec.type,
          source: 'NBA_ENGINE',
          description: rec.action,
          priority_score: impact.probabilityImpact,
          impact_score: impact.revenueImpact,
          explanation: explanation,
          status: 'ACTIVE'
        })
        .select()
        .single();
        
      if (savedRec) {
        // Save evidence
        await supabase.from('recommendation_evidence').insert({
          recommendation_id: savedRec.id,
          evidence_type: rec.evidence.type,
          source_record_id: rec.evidence.source_id ?? '00000000-0000-0000-0000-000000000000',
          description: rec.evidence.description
        });
        
        // Save driver
        await supabase.from('recommendation_drivers').insert({
          recommendation_id: savedRec.id,
          driver_type: rec.driver,
          description: rec.evidence.description
        });
        
        // Save impact
        await supabase.from('recommendation_impacts').insert({
          recommendation_id: savedRec.id,
          probability_impact: impact.probabilityImpact,
          revenue_impact: impact.revenueImpact,
          risk_reduction: impact.riskReduction
        });
        
        // Save confidence
        await supabase.from('recommendation_confidence').insert({
          recommendation_id: savedRec.id,
          confidence_score: 85,
          confidence_level: 'HIGH'
        });
      }
    }
    
    return allRecs.length;
  }
}
