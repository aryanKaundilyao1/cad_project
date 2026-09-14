import { supabase } from "@/integrations/supabase/client";

export class PlaybookEffectivenessEngine {
  /**
   * Recalculates aggregate effectiveness stats for a playbook type.
   */
  static async recalculate(executionId: string) {
    const { data: exec } = await supabase
      .from('playbook_executions')
      .select('playbook_id')
      .eq('id', executionId)
      .single();
      
    if (!exec) return;

    // Fetch all outcomes for this playbook type
    const { data: outcomes } = await supabase
      .from('playbook_outcomes')
      .select('probability_change, revenue_change')
      .eq('execution_id.playbook_id', exec.playbook_id)
      .eq('status', 'MEASURED');

    if (!outcomes || outcomes.length === 0) return;

    let totalProb = 0;
    let totalRev = 0;
    let successCount = 0;

    outcomes.forEach(o => {
      totalProb += (o.probability_change || 0);
      totalRev += (o.revenue_change || 0);
      if (o.probability_change && o.probability_change > 0) {
        successCount++;
      }
    });

    const avgProb = totalProb / outcomes.length;
    const avgRev = totalRev / outcomes.length;
    const successRate = (successCount / outcomes.length) * 100;

    await supabase
      .from('playbook_effectiveness')
      .upsert({
        playbook_id: exec.playbook_id,
        total_executions: outcomes.length,
        success_rate: successRate,
        avg_probability_improvement: avgProb,
        avg_revenue_improvement: avgRev,
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'playbook_id' });
  }
}
