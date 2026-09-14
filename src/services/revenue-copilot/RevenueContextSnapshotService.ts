import { supabase } from "@/integrations/supabase/client";

export class RevenueContextSnapshotService {
  /**
   * Stores the massive, aggregated JSON payload of portfolio intelligence 
   * at the exact moment a session starts.
   */
  static async createSnapshot(sessionId: string, snapshotType: string, payload: any, tokens: number) {
    const { data: snapshot, error } = await supabase.from('revenue_context_snapshots').insert({
      session_id: sessionId,
      snapshot_type: snapshotType,
      context_data: payload,
      token_usage: tokens
    }).select('id').single();

    if (error || !snapshot) throw new Error("Failed to create Revenue Context Snapshot");

    return snapshot.id;
  }
}
