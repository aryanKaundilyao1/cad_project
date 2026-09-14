import { supabase } from "@/integrations/supabase/client";

export class OpportunityProfileService {
  
  static async getCompanyProfile(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*, company_intelligence_profiles(*), opportunity_scores(*, score_reason_codes(*))')
      .eq('id', companyId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
  
  static async getTimeline(companyId: string) {
    const { data, error } = await supabase
      .from('opportunity_score_history')
      .select('*, products(name)')
      .eq('company_id', companyId)
      .order('snapshot_date', { ascending: true });
      
    if (error) throw error;
    return data;
  }
  
  static async getReasonCodes(companyId: string) {
    const { data, error } = await supabase
      .from('opportunity_scores')
      .select('id, score_reason_codes(*)')
      .eq('company_id', companyId);
      
    if (error) throw error;
    
    // Flatten reason codes from multiple products if they exist
    return data.flatMap((d: any) => d.score_reason_codes || []);
  }
}
