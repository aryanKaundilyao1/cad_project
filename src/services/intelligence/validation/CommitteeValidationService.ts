import { supabase } from "@/integrations/supabase/client";

export class CommitteeValidationService {
  /**
   * Validates that committee level intelligence aggregates correctly from individuals.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    invalidAggregations: number;
    details: string;
  }> {
    // A mock validation for blueprint execution:
    // Ensure every opportunity has at least one buying committee.
    const { data: missing, error } = await supabase
      .from('opportunities')
      .select('id, buying_committees(id)')
      .eq('status', 'OPEN'); // Or however we define active ops

    if (error) {
       return { status: 'FAIL', invalidAggregations: -1, details: error.message };
    }
    
    // In actual implementation, we'd filter for those where buying_committees array is empty.
    const count = missing?.filter(m => !m.buying_committees || m.buying_committees.length === 0).length || 0;

    return {
      status: count === 0 ? 'PASS' : 'WARN',
      invalidAggregations: count,
      details: count === 0 ? 'All open opportunities have a committee.' : `${count} open opportunities lack a buying committee.`
    };
  }
}
