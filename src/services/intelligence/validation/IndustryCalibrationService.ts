import { supabase } from "@/integrations/supabase/client";

export class IndustryCalibrationService {
  /**
   * Validates that industry specific taxonomies (e.g. EPC, Procurement) are seeded.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    industryRolesFound: number;
    details: string;
  }> {
    const { data: roles, error } = await supabase
      .from('stakeholder_role_definitions')
      .select('id')
      .in('role_name', ['General Contractor', 'Chief Procurement Officer']);

    if (error) {
       return { status: 'FAIL', industryRolesFound: -1, details: error.message };
    }

    const count = roles?.length || 0;

    return {
      status: count === 2 ? 'PASS' : 'FAIL', // Expecting at least these two key industry seeds
      industryRolesFound: count,
      details: count === 2 ? 'Industry taxonomy is calibrated.' : 'Missing critical industry role definitions.'
    };
  }
}
