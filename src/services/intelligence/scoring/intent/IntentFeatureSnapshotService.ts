import { supabase } from "@/integrations/supabase/client";

export interface IntentFeatureSnapshot {
  id?: string;
  company_id: string;
  product_id: string;
  feature_key: string;
  feature_value: any;
  feature_version: number;
  snapshot_time?: string;
}

export class IntentFeatureSnapshotService {
  /**
   * Persists an array of intent feature snapshots into the database.
   */
  static async storeSnapshots(snapshots: IntentFeatureSnapshot[]): Promise<void> {
    if (!snapshots || snapshots.length === 0) return;

    const companyId = snapshots[0].company_id;
    const productId = snapshots[0].product_id;

    // Clear old snapshots
    await supabase
      .from('intent_feature_snapshots')
      .delete()
      .eq('company_id', companyId)
      .eq('product_id', productId);

    // Insert new snapshots
    const { error } = await supabase
      .from('intent_feature_snapshots')
      .insert(snapshots);

    if (error) {
      console.error("Error storing intent feature snapshots:", error);
      throw new Error(`Failed to store intent feature snapshots: ${error.message}`);
    }
  }

  /**
   * Retrieves the latest intent feature snapshots for a specific company and product.
   */
  static async getSnapshots(companyId: string, productId: string): Promise<IntentFeatureSnapshot[]> {
    const { data, error } = await supabase
      .from('intent_feature_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (error) {
      console.error("Error fetching intent feature snapshots:", error);
      throw new Error(`Failed to fetch intent feature snapshots: ${error.message}`);
    }

    return data || [];
  }
}
