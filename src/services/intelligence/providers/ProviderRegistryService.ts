import { supabase } from "@/integrations/supabase/client";

export interface SignalProvider {
  id: string;
  name: string;
  provider_type: string;
  category: string;
  auth_method: string;
  status: string;
  rate_limits: any;
  sync_frequency: string;
  is_enabled: boolean;
  last_sync: string | null;
  error_count: number;
  health_status: string;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export const ProviderRegistryService = {
  
  async getProviders(): Promise<SignalProvider[]> {
    const { data, error } = await supabase
      .from('signal_providers')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  },

  async getProviderById(id: string): Promise<SignalProvider | null> {
    const { data, error } = await supabase
      .from('signal_providers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async registerProvider(provider: Partial<SignalProvider>): Promise<SignalProvider> {
    const { data, error } = await supabase
      .from('signal_providers')
      .insert(provider)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateProvider(id: string, updates: Partial<SignalProvider>): Promise<SignalProvider> {
    const { data, error } = await supabase
      .from('signal_providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async toggleProvider(id: string, is_enabled: boolean): Promise<SignalProvider> {
    return this.updateProvider(id, { is_enabled });
  }
};
