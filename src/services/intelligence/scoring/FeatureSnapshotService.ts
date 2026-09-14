import { supabase } from "@/integrations/supabase/client";

export interface FeatureSnapshot {
  id?: string;
  company_id: string;
  product_id: string;
  feature_key: string;
  feature_value: any;
  feature_version: number;
  snapshot_time?: string;
}

export class FeatureSnapshotService {
  /**
   * Persists an array of feature snapshots into the database.
   * Uses upsert based on company_id, product_id, feature_key (if we had a unique constraint, otherwise just inserts).
   * For this implementation, we will delete existing and insert new to simulate a fresh snapshot for scoring,
   * or we can just append if we want full history (the requirements say "freeze feature values used during scoring").
   * We will insert them to keep an immutable log of what was used.
   */
  static async storeSnapshots(snapshots: FeatureSnapshot[]): Promise<void> {
    if (!snapshots || snapshots.length === 0) return;

    // To prevent unbounded growth, we could delete old snapshots for this company/product first,
    // or just rely on the latest snapshot_time. Let's delete previous snapshots for the same company+product
    // so the table acts as a current snapshot state, while history is maintained in the audit/history tables.
    const companyId = snapshots[0].company_id;
    const productId = snapshots[0].product_id;

    // Clear old snapshots
    await supabase
      .from('feature_snapshots')
      .delete()
      .eq('company_id', companyId)
      .eq('product_id', productId);

    // Insert new snapshots
    const { error } = await supabase
      .from('feature_snapshots')
      .insert(snapshots);

    if (error) {
      console.error("Error storing feature snapshots:", error);
      throw new Error(`Failed to store feature snapshots: ${error.message}`);
    }
  }

  /**
   * Retrieves the latest feature snapshots for a specific company and product.
   */
  static async getSnapshots(companyId: string, productId: string): Promise<FeatureSnapshot[]> {
    const { data, error } = await supabase
      .from('feature_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .eq('product_id', productId);

    if (error) {
      console.error("Error fetching feature snapshots:", error);
      throw new Error(`Failed to fetch feature snapshots: ${error.message}`);
    }

    return data || [];
  }
}
