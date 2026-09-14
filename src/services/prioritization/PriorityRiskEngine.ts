import { supabase } from "@/integrations/supabase/client";

export class PriorityRiskEngine {
  /**
   * Overrides standard scoring if extreme risk factors exist.
   */
  static async evaluate(opportunityId: string, priorityId: string) {
    const risks = [];

    // Check for Ignored Opportunities
    const { data: actions } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    if (actions && actions.length > 0) {
      const oldestAction = Math.min(...actions.map(a => new Date(a.created_at).getTime()));
      const daysPending = (Date.now() - oldestAction) / (1000 * 60 * 60 * 24);

      if (daysPending > 14) {
        risks.push({
          opportunity_priority_id: priorityId,
          risk_type: 'IGNORED_OPP',
          description: 'High priority actions have been pending for >14 days',
          severity: 'HIGH'
        });
      }
    }

    if (risks.length > 0) {
      await supabase.from('priority_risks').insert(risks);
    }

    return risks;
  }
}
