import { supabase } from "@/integrations/supabase/client";

export interface FeatureDefinition {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_category: string;
  description: string | null;
  data_type: string;
  source: string;
  active: boolean;
  created_at: string;
}

export class FeatureRegistryService {
  /**
   * Retrieves all active features from the registry.
   */
  static async getActiveFeatures(): Promise<FeatureDefinition[]> {
    const { data, error } = await supabase
      .from('feature_registry')
      .select('*')
      .eq('active', true)
      .order('feature_key');
      
    if (error) {
      console.error("Error fetching feature registry:", error);
      throw new Error("Failed to fetch features");
    }
    
    return data || [];
  }

  /**
   * Ensure a specific set of standard features exist
   */
  static async getFeatureByKey(key: string): Promise<FeatureDefinition | null> {
    const { data, error } = await supabase
      .from('feature_registry')
      .select('*')
      .eq('feature_key', key)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      console.error(`Error fetching feature ${key}:`, error);
      return null;
    }
    
    return data;
  }
}
