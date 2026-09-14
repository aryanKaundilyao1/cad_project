import { supabase } from "@/integrations/supabase/client";

export class BlockerValidationService {
  /**
   * Validates that all Active Blockers actually possess negative sentiment.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    falsePositives: number;
    details: string;
  }> {
    const { data: falsePositives, error } = await supabase
      .from('stakeholder_intelligence')
      .select('*, stakeholder_profiles!inner(sentiment_score)')
      .eq('blocker_status', 'ACTIVE_BLOCKER')
      .gte('stakeholder_profiles.sentiment_score', 0); // If sentiment is neutral or positive, it's a false positive

    if (error) {
       return { status: 'FAIL', falsePositives: -1, details: error.message };
    }

    const count = falsePositives?.length || 0;

    return {
      status: count === 0 ? 'PASS' : 'FAIL',
      falsePositives: count,
      details: count === 0 ? 'No false positive blockers detected.' : `${count} active blockers have neutral or positive sentiment.`
    };
  }
}
