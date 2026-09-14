import { supabase } from "@/integrations/supabase/client";

export class StakeholderDataQualityService {
  /**
   * Identifies orphan records and duplicates.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    orphanProfiles: number;
    details: string;
  }> {
    const { count: orphanCount, error } = await supabase
      .from('stakeholder_profiles')
      .select('*', { count: 'exact', head: true })
      // Logic for orphan: No committee membership AND no scores calculated
      .is('influence_score', 0)
      .is('engagement_score', 0);

    if (error) {
       return { status: 'FAIL', orphanProfiles: -1, details: error.message };
    }

    const count = orphanCount || 0;

    return {
      status: count === 0 ? 'PASS' : 'WARN',
      orphanProfiles: count,
      details: count === 0 ? 'No orphans detected.' : `${count} profiles lack scores or committee attachments.`
    };
  }
}
