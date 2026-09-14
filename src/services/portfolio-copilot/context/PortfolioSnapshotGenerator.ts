import { supabase } from "@/integrations/supabase/client";

export class PortfolioSnapshotGenerator {
  /**
   * Takes a point-in-time snapshot of the portfolio graph for historical query accuracy.
   */
  static async snapshot(packageId: string, metadata: any) {
    const { data: snapshot, error } = await supabase.from('portfolio_graph_snapshots').insert({
      package_id: packageId,
      snapshot_metadata: metadata
    }).select('id').single();

    if (error || !snapshot) throw new Error("Failed to generate portfolio graph snapshot");
    return snapshot.id;
  }
}
