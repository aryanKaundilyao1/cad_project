import { supabase } from "@/integrations/supabase/client";

export class DecisionWorkspaceController {
  /**
   * Aggregates the core decision profile and its latest intelligence scores.
   * Prevents the frontend from needing to perform complex joins or N+1 queries.
   */
  static async getDecisionWorkspace(opportunityId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('decision_profiles')
      .select('*, decision_stages(*)')
      .eq('opportunity_id', opportunityId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') return null; // No profile exists yet
      throw profileError;
    }

    // Fetch the latest calculated scores
    const { data: intelligence, error: intelError } = await supabase
      .from('decision_scores')
      .select('*')
      .eq('decision_profile_id', profile.id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (intelError && intelError.code !== 'PGRST116') throw intelError;

    return {
      profile,
      intelligence: intelligence || null
    };
  }
}
