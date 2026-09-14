import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  title?: string;
  email?: string;
}

export interface SignalDefinition {
  id: string;
  name: string;
  category: string;
  weight_tier?: string;
  base_weight?: number;
}

export interface SignalEvent {
  id: string;
  company_id: string;
  signal_definition_id: string;
  payload: any;
  raw_source: string;
  confidence?: number;
  reliability?: string;
  created_at: string;
  signal_definition?: SignalDefinition;
}

export const SignalService = {
  getBaseQuery(table: string) {
    return supabase.from(table);
  },

  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Company[];
  },

  async createCompany(company: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();
    
    if (error) throw error;
    return data as Company;
  },

  async getSignalDefinitions() {
    const { data, error } = await supabase
      .from('signal_definitions')
      .select('*');
    
    if (error) throw error;
    return data as SignalDefinition[];
  },

  async createSignalDefinition(def: Partial<SignalDefinition>) {
    const { data, error } = await supabase
      .from('signal_definitions')
      .insert(def)
      .select()
      .single();
      
    if (error) throw error;
    return data as SignalDefinition;
  },

  async recordSignalEvent(event: Partial<SignalEvent>) {
    const { data, error } = await supabase
      .from('signal_event_store')
      .insert(event)
      .select()
      .single();
      
    if (error) throw error;
    return data as SignalEvent;
  },

  async getCompanySignalTimeline(companyId: string) {
    const { data, error } = await supabase
      .from('signal_event_store')
      .select(`
        *,
        signal_definition:signal_definitions(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }
};
