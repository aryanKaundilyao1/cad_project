import { supabase } from "@/integrations/supabase/client";

export class PortfolioDomainReferenceService {
  /**
   * Explictly tracks exactly which underlying intelligence nodes were used
   * to build a specific context snapshot. Ensures perfect traceability.
   */
  static async recordReferences(snapshotId: string, references: { domain: string, source_id: string }[]) {
    const records = references.map(ref => ({
      snapshot_id: snapshotId,
      domain: ref.domain,
      source_record_id: ref.source_id
    }));

    if (records.length > 0) {
      await supabase.from('portfolio_domain_references').insert(records);
    }
  }
}
