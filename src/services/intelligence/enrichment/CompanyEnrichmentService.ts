import { supabase } from "@/integrations/supabase/client";

export class CompanyEnrichmentService {
  /**
   * Appends an immutable enrichment record for a company.
   */
  static async appendEnrichment(companyId: string, sourceId: string, fieldName: string, fieldValue: any, reliability: string = 'medium'): Promise<void> {
    const { error } = await supabase.from('company_enrichment_history').insert({
      company_id: companyId,
      source_id: sourceId,
      field_name: fieldName,
      field_value: fieldValue,
      reliability
    });

    if (error) throw error;
    
    // Optionally trigger an event to update the main companies table with the latest canonical values if reliability is high
  }

  /**
   * Fetches the entire enrichment history for a company.
   */
  static async getCompanyEnrichmentHistory(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('company_enrichment_history')
      .select('*, enrichment_sources(source_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
