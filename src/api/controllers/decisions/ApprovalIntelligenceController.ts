import { supabase } from "@/integrations/supabase/client";

export class ApprovalIntelligenceController {
  /**
   * Fetches the entire approval chain topology along with the latest intelligence metrics.
   */
  static async getApprovalIntelligence(decisionProfileId: string) {
    const { data: chain, error: chainError } = await supabase
      .from('approval_chains')
      .select(`
        *,
        approval_steps(
          *,
          approval_members(*)
        )
      `)
      .eq('decision_profile_id', decisionProfileId)
      .single();

    if (chainError) {
       if (chainError.code === 'PGRST116') return null;
       throw chainError;
    }

    // Fetch the latest intelligence calculation for this chain
    const { data: intelligence, error: intelError } = await supabase
      .from('approval_intelligence')
      .select('*')
      .eq('approval_chain_id', chain.id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (intelError && intelError.code !== 'PGRST116') throw intelError;

    return {
      chain,
      intelligence: intelligence || null
    };
  }
}
