import { supabase } from "@/integrations/supabase/client";
import { PriorityDriverEngine } from "./PriorityDriverEngine";
import { PriorityMomentumEngine } from "./PriorityMomentumEngine";
import { PriorityRiskEngine } from "./PriorityRiskEngine";
import { PriorityConfidenceEngine } from "./PriorityConfidenceEngine";
import { PriorityExplanationService } from "./PriorityExplanationService";

export class OpportunityPrioritizationEngine {
  /**
   * Generates the dynamic priority score and rank for an opportunity.
   */
  static async calculatePriority(opportunityId: string) {
    // 1. Fetch or Create Priority Record
    let { data: priority } = await supabase
      .from('opportunity_priorities')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (!priority) {
      const { data } = await supabase
        .from('opportunity_priorities')
        .insert({ opportunity_id: opportunityId, priority_score: 50 })
        .select()
        .single();
      priority = data;
    }

    if (!priority) throw new Error("Failed to initialize priority record");

    // 2. Clear old drivers, risks, confidence
    await supabase.from('priority_drivers').delete().eq('opportunity_priority_id', priority.id);
    await supabase.from('priority_risks').delete().eq('opportunity_priority_id', priority.id);
    await supabase.from('priority_confidence').delete().eq('opportunity_priority_id', priority.id);

    // 3. Run Sub-Engines
    const drivers = await PriorityDriverEngine.evaluate(opportunityId, priority.id);
    const risks = await PriorityRiskEngine.evaluate(opportunityId, priority.id);
    await PriorityConfidenceEngine.evaluate(opportunityId, priority.id);

    // 4. Calculate Base Score
    // Starts at 50, modified by drivers.
    let newScore = 50;
    drivers.forEach(d => { newScore += d.impact_weight; });
    
    // Clamp score
    newScore = Math.max(0, Math.min(100, newScore));
    
    // Fetch opportunity to check stage
    const { data: opp } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('id', opportunityId)
      .single();

    // Determine level
    let level = 'LOW';
    if (opp?.stage === 'Won' || opp?.stage === 'Lost') {
      level = 'ARCHIVED';
    } else {
      if (newScore > 40) level = 'MEDIUM';
      if (newScore > 70) level = 'HIGH';
      if (newScore > 80) level = 'HOT';
      if (newScore > 90 || risks.length > 0) level = 'CRITICAL';
    }

    // 5. Calculate Momentum
    const { momentum } = await PriorityMomentumEngine.evaluate(opportunityId, newScore);

    // 6. Generate Explanation
    const explanation = PriorityExplanationService.generateExplanation(newScore, drivers, momentum, risks);

    // 7. Update Record
    await supabase
      .from('opportunity_priorities')
      .update({
        priority_score: newScore,
        priority_level: level
      })
      .eq('id', priority.id);

    return { newScore, level, explanation };
  }
}
