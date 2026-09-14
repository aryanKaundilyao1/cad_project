import { supabase } from "@/integrations/supabase/client";

export class PriorityDriverEngine {
  /**
   * Identifies the core drivers (accelerators/blockers) that impact this deal's priority.
   */
  static async evaluate(opportunityId: string, priorityId: string) {
    const drivers = [];
    
    // Example: High Revenue acts as an accelerator
    const { data: forecast } = await supabase
      .from('forecast_scenarios')
      .select('expected_case_amount')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (forecast && forecast.expected_case_amount > 500000) {
      drivers.push({
        opportunity_priority_id: priorityId,
        driver_type: 'ACCELERATOR',
        description: 'High Expected Revenue (>500k)',
        impact_weight: 15.0
      });
    }

    // Example: Stalled Approval acts as a blocker
    const { data: approvals } = await supabase
      .from('approval_intelligence')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'STALLED');

    if (approvals && approvals.length > 0) {
      drivers.push({
        opportunity_priority_id: priorityId,
        driver_type: 'BLOCKER',
        description: 'Critical approvals are currently stalled',
        impact_weight: -20.0
      });
    }

    // Persist
    if (drivers.length > 0) {
      await supabase.from('priority_drivers').insert(drivers);
    }

    return drivers;
  }
}
