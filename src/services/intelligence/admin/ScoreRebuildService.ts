/**
 * ScoreRebuildService — Admin Trigger
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE STATUS: Awaiting OIE UI Integration
 *
 * The legacy MasterOpportunityScoreEngine has been preserved at:
 *   legacy_engine/scoring/master/MasterOpportunityScoreEngine.ts
 *
 * It is NOT imported here to avoid breaking the Vite build (the legacy engine
 * has unresolved signal dependencies that cannot be resolved in the new tree).
 *
 * To trigger scoring from the admin panel, the new OIE pipeline must first
 * be connected to ScorePersistenceService (Phase: UI Integration).
 *
 * Until then, calling rebuildSingle() or rebuildAll() will return a stub
 * response so the admin page doesn't crash.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Future import (uncomment when UI integration is approved) ─────────────────
// import { scoreBatch } from "@/scoring/pipeline";

export class ScoreRebuildService {

  static async rebuildSingle(companyId: string, productId: string) {
    console.warn(
      '[ScoreRebuildService] Legacy engine is deprecated. ' +
      'OIE UI integration pending — rebuildSingle() is a no-op until then.'
    );
    return {
      status: 'pending_oie_integration',
      company_id: companyId,
      product_id: productId,
      message: 'Scoring engine upgraded to OIE v1. UI integration in next phase.',
    };
  }

  static async rebuildAll() {
    console.warn(
      '[ScoreRebuildService] Legacy engine is deprecated. ' +
      'OIE UI integration pending — rebuildAll() is a no-op until then.'
    );

    // Read existing scores so admin page can still show counts
    const { data: scores, error } = await supabase
      .from('opportunity_scores')
      .select('company_id, product_id');

    if (error) throw error;

    return {
      status: 'pending_oie_integration',
      total: scores?.length ?? 0,
      success: 0,
      failed: 0,
      message: 'Scoring engine upgraded to OIE v1. UI integration in next phase.',
    };
  }
}
