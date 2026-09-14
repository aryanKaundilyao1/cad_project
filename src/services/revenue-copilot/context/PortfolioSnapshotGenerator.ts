import { supabase } from "@/integrations/supabase/client";

export class PortfolioSnapshotGenerator {
  /**
   * Persists the compressed, prioritized portfolio context to the database.
   */
  static async saveSnapshot(sessionId: string, packageType: string, compressionLevel: string, payload: any) {
    const { data, error } = await supabase.from('portfolio_context_packages').insert({
      session_id: sessionId,
      package_type: packageType,
      compression_level: compressionLevel,
      payload: payload,
      token_usage: JSON.stringify(payload).length // Very rough mock for tokens
    }).select('id').single();

    if (error || !data) throw new Error("Failed to save Portfolio Context Package");
    return data.id;
  }
}
