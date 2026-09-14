import { supabase } from "@/integrations/supabase/client";

export interface EngagementFeatureSnapshot {
  id?: string;
  company_id: string;
  product_id: string;
  feature_key: string;
  feature_value: any;
  feature_version: number;
  snapshot_time?: string;
}

export class EngagementFeatureSnapshotService {
  static async storeSnapshots(snapshots: EngagementFeatureSnapshot[]): Promise<void> {
    if (!snapshots || snapshots.length === 0) return;

    const companyId = snapshots[0].company_id;
    const productId = snapshots[0].product_id;

    await supabase
      .from('engagement_feature_snapshots')
      .delete()
      .eq('company_id', companyId)
      .eq('product_id', productId);

    const { error } = await supabase
      .from('engagement_feature_snapshots')
      .insert(snapshots);

    if (error) {
      console.error("Error storing engagement feature snapshots:", error);
      throw new Error(`Failed to store engagement feature snapshots: ${error.message}`);
    }
  }

  static async getSnapshots(companyId: string, productId: string): Promise<EngagementFeatureSnapshot[]> {
    const { data, error } = await supabase
      .from('engagement_feature_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (error) {
      console.error("Error fetching engagement feature snapshots:", error);
      throw new Error(`Failed to fetch engagement feature snapshots: ${error.message}`);
    }

    return data || [];
  }
}
