import { supabase } from "@/integrations/supabase/client";

export interface WeightProfile {
  id?: string;
  industry: string;
  fit_weight: number;
  intent_weight: number;
  timing_weight: number;
  engagement_weight: number;
  version: string;
  is_active: boolean;
}

export class WeightManagerService {
  static async getProfiles(): Promise<WeightProfile[]> {
    const { data, error } = await supabase
      .from('vertical_weight_profiles')
      .select('*')
      .order('industry');
      
    if (error && error.code === '42P01') {
      // Table doesn't exist yet, return mocks
      return this.getMockProfiles();
    }
    if (error) throw error;
    
    return data || [];
  }
  
  static async updateProfile(profile: WeightProfile): Promise<void> {
    const { error } = await supabase
      .from('vertical_weight_profiles')
      .upsert({
        industry: profile.industry.toLowerCase(),
        fit_weight: profile.fit_weight,
        intent_weight: profile.intent_weight,
        timing_weight: profile.timing_weight,
        engagement_weight: profile.engagement_weight,
        version: profile.version,
        is_active: profile.is_active,
        updated_at: new Date().toISOString()
      }, { onConflict: 'industry' });
      
    if (error) {
      if (error.code === '42P01') {
        console.warn('DB not migrated, fake update completed.');
        return;
      }
      throw error;
    }
  }

  private static getMockProfiles(): WeightProfile[] {
    return [
      { industry: 'construction', fit_weight: 0.20, intent_weight: 0.20, timing_weight: 0.40, engagement_weight: 0.20, version: 'v1.0', is_active: true },
      { industry: 'manufacturing', fit_weight: 0.30, intent_weight: 0.25, timing_weight: 0.25, engagement_weight: 0.20, version: 'v1.0', is_active: true },
      { industry: 'procurement', fit_weight: 0.20, intent_weight: 0.30, timing_weight: 0.20, engagement_weight: 0.30, version: 'v1.0', is_active: true },
      { industry: 'default', fit_weight: 0.25, intent_weight: 0.30, timing_weight: 0.25, engagement_weight: 0.20, version: 'v1.0', is_active: true }
    ];
  }
}
