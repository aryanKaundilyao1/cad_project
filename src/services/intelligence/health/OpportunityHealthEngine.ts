import { supabase } from "@/integrations/supabase/client";

export class OpportunityHealthEngine {
  /**
   * Calculates the health status and score of an opportunity.
   */
  static async evaluate(opportunityId: string) {
    // 1. Fetch Opportunity and Recent Activity
    const { data: opp } = await supabase
      .from('opportunities')
      .select('*, company:jas_companies(*)')
      .eq('id', opportunityId)
      .single();

    if (!opp) throw new Error("Opportunity not found");

    // Check if dead/archived
    if (opp.stage === 'Lost') return this.updateHealth(opportunityId, 'Dead', 0, 0);
    if (opp.stage === 'Won') return this.updateHealth(opportunityId, 'Stable', 100, 0);

    // 2. Fetch Signals for Momentum
    const { data: signals } = await supabase
      .from('company_signals')
      .select('created_at')
      .eq('company_id', opp.company_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const recentSignalsCount = signals?.length || 0;
    
    // 3. Calculate Momentum (Simple derivative of activity)
    let momentum = 0;
    if (recentSignalsCount > 5) momentum = 5.0;
    else if (recentSignalsCount > 2) momentum = 2.0;
    else if (recentSignalsCount === 0) momentum = -2.0;

    // 4. Calculate Health Score
    // Base health relies heavily on master_score and confidence, plus momentum
    let healthScore = (opp.master_score || opp.confidence || 50) + momentum * 2;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 5. Determine Health Status
    let status = 'Stable';
    if (healthScore > 80 && momentum > 0) status = 'Growing';
    else if (healthScore > 70) status = 'Healthy';
    else if (healthScore < 40) status = 'At Risk';
    else if (healthScore < 60 && momentum < 0) status = 'Cooling';

    return this.updateHealth(opportunityId, status, healthScore, momentum);
  }

  private static async updateHealth(opportunityId: string, status: string, score: number, momentum: number) {
    const { data, error } = await supabase
      .from('opportunity_health')
      .upsert(
        {
          opportunity_id: opportunityId,
          health_status: status,
          health_score: score,
          momentum: momentum,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'opportunity_id' }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to update health", error);
    }
    return data;
  }
}
