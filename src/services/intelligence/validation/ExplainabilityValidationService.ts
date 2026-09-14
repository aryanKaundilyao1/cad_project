import { supabase } from "@/integrations/supabase/client";

export class ExplainabilityValidationService {
  /**
   * Validates that all intelligence outputs have mathematical/signal evidence.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    unexplainedRecords: number;
    details: string;
  }> {
    const { count: missingEvidenceCount, error } = await supabase
      .from('stakeholder_intelligence')
      .select('*', { count: 'exact', head: true })
      .filter('evidence', 'eq', '[]'); // Checking for empty JSON array

    if (error) {
       return { status: 'FAIL', unexplainedRecords: -1, details: error.message };
    }

    const count = missingEvidenceCount || 0;

    return {
      status: count === 0 ? 'PASS' : 'FAIL',
      unexplainedRecords: count,
      details: count === 0 ? 'All intelligence decisions are explained.' : `${count} records are missing evidence vectors.`
    };
  }
}
