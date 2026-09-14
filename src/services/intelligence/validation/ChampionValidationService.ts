import { supabase } from "@/integrations/supabase/client";

export class ChampionValidationService {
  /**
   * Validates that all Confirmed Champions actually possess influence and positive sentiment.
   */
  static async validate(): Promise<{
    status: 'PASS' | 'WARN' | 'FAIL';
    falsePositives: number;
    details: string;
  }> {
    const { data: falsePositives, error } = await supabase
      .from('stakeholder_intelligence')
      .select('*, stakeholder_profiles!inner(influence_score, sentiment_score)')
      .eq('champion_status', 'CONFIRMED_CHAMPION')
      .or('stakeholder_profiles.influence_score.lt.40,stakeholder_profiles.sentiment_score.lt.0');

    if (error) {
       return { status: 'FAIL', falsePositives: -1, details: error.message };
    }

    const count = falsePositives?.length || 0;

    return {
      status: count === 0 ? 'PASS' : 'FAIL',
      falsePositives: count,
      details: count === 0 ? 'No false positive champions detected.' : `${count} champions lack required influence or sentiment.`
    };
  }
}
