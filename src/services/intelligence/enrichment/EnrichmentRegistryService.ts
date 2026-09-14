import { supabase } from "@/integrations/supabase/client";

export class EnrichmentRegistryService {
  static async getSources(): Promise<any[]> {
    const { data, error } = await supabase.from('enrichment_sources').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async registerSource(source: any): Promise<any> {
    const { data, error } = await supabase.from('enrichment_sources').insert(source).select().single();
    if (error) throw error;
    return data;
  }
}
