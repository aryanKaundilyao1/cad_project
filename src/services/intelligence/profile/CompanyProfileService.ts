import { supabase } from "@/integrations/supabase/client";

export interface CompanyIntelligenceProfile {
  company: any;
  aliases: any[];
  enrichments: any[];
  signals: any[];
}

export class CompanyProfileService {
  /**
   * Aggregates a comprehensive intelligence profile for a canonical company.
   */
  static async getIntelligenceProfile(companyId: string): Promise<CompanyIntelligenceProfile> {
    
    // 1. Get core company data
    const { data: company, error: coErr } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (coErr) throw coErr;

    // 2. Get aliases
    const { data: aliases } = await supabase.from('company_aliases').select('*').eq('company_id', companyId);

    // 3. Get enrichments
    const { data: enrichments } = await supabase
      .from('company_enrichment_history')
      .select('*, enrichment_sources(source_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // 4. Get signals (Timeline events)
    const { data: signals } = await supabase
      .from('signal_event_store')
      .select('*, signal_definitions(name, category, weight_tier)')
      .eq('company_id', companyId)
      .order('occurred_at', { ascending: false });

    return {
      company,
      aliases: aliases || [],
      enrichments: enrichments || [],
      signals: signals || []
    };
  }
}
