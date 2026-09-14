import { supabase } from "@/integrations/supabase/client";

export class PriorityMomentumEngine {
  /**
   * Tracks the velocity of the priority score over time.
   */
  static async evaluate(opportunityId: string, currentScore: number) {
    const { data: snapshots } = await supabase
      .from('priority_snapshots')
      .select('priority_score')
      .eq('opportunity_id', opportunityId)
      .order('snapshot_date', { ascending: false })
      .limit(1);

    const previousScore = snapshots && snapshots.length > 0 ? snapshots[0].priority_score : currentScore;
    const delta = currentScore - previousScore;

    let momentum = 'STABLE';
    if (delta > 5) momentum = 'UP';
    if (delta < -5) momentum = 'DOWN';

    // Take a new snapshot
    await supabase.from('priority_snapshots').insert({
      opportunity_id: opportunityId,
      priority_score: currentScore
    });

    return { momentum, delta };
  }
}
