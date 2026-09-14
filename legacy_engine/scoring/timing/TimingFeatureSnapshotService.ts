import { supabase } from "@/integrations/supabase/client";

export interface TimingFeatureSnapshot {
  id?: string;
  company_id: string;
  product_id: string;
  feature_key: string;
  feature_value: any;
  feature_version: number;
  snapshot_time?: string;
}

export class TimingFeatureSnapshotService {
  static async storeSnapshots(snapshots: TimingFeatureSnapshot[]): Promise<void> {
    if (!snapshots || snapshots.length === 0) return;

    const companyId = snapshots[0].company_id;
    const productId = snapshots[0].product_id;

    await supabase
      .from('timing_feature_snapshots')
      .delete()
      .eq('company_id', companyId)
      .eq('product_id', productId);

    const { error } = await supabase
      .from('timing_feature_snapshots')
      .insert(snapshots);

    if (error) {
      console.error("Error storing timing feature snapshots:", error);
      throw new Error(`Failed to store timing feature snapshots: ${error.message}`);
    }
  }

  static async getSnapshots(companyId: string, productId: string): Promise<TimingFeatureSnapshot[]> {
    const { data, error } = await supabase
      .from('timing_feature_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (error) {
      console.error("Error fetching timing feature snapshots:", error);
      throw new Error(`Failed to fetch timing feature snapshots: ${error.message}`);
    }

    return data || [];
  }
}
