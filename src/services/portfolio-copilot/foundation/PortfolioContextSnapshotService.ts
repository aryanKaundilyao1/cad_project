import { supabase } from "@/integrations/supabase/client";
import { PortfolioDomainReferenceService } from "./PortfolioDomainReferenceService";

export class PortfolioContextSnapshotService {
  /**
   * Persists a compressed view of the entire portfolio at a specific moment in time.
   */
  static async createSnapshot(sessionId: string, crossDomainMetrics: any, domainReferences: any[]) {
    const { data: snapshot, error } = await supabase.from('portfolio_context_snapshots').insert({
      session_id: sessionId,
      cross_domain_metrics: crossDomainMetrics
    }).select('id').single();

    if (error || !snapshot) throw new Error("Failed to create portfolio snapshot");

    // Persist the exact intelligence domain records used to build this snapshot
    await PortfolioDomainReferenceService.recordReferences(snapshot.id, domainReferences);

    return snapshot.id;
  }
}
