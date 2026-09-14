/**
 * CONF — Confidence Score
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.3):
 *   Reliability of the evidence itself, independent of the opportunity's merit.
 *   "How much do we trust this record?"
 *
 * Formula [PROVEN — noisy-OR combination]:
 *   CONF = 1 - Π(1 - rᵢ)
 *   where rᵢ = adjusted reliability score for each independent evidence signal.
 *
 *   Signals combined:
 *     r₁ = source_reliability × extraction_modifier
 *     r₂ = freshness_decay (how fresh is the evidence)
 *     r₃ = corroboration bonus per additional independent source
 *
 * Sources are de-duplicated by lineage (corroborating_sources_deduped) to
 * prevent two scrapers pulling from the same directory from counting as
 * independent evidence.
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { MetricResult } from '../types';

// Corroboration bonus per additional independent source (diminishing returns)
const CORROBORATION_BONUS_PER_SOURCE = 0.15;
const CORROBORATION_MAX_SOURCES = 4; // beyond 4, diminishing returns are negligible

export function scoreCONF(features: FeatureSet): MetricResult {
  const contributing: string[] = [];
  const missing: string[] = [];

  const reliabilities: number[] = [];

  // ── r₁: Source reliability × extraction method ───────────────────────────
  const sourceRel = features.f_conf_source_reliability.value; // always present
  const extractionMod = features.f_conf_extraction_modifier.value; // always present
  const r1 = Math.min(1.0, sourceRel * extractionMod);
  reliabilities.push(r1);
  contributing.push(
    `Source reliability: ${(sourceRel * 100).toFixed(0)}% × extraction modifier: ${(extractionMod * 100).toFixed(0)}% → r₁=${(r1 * 100).toFixed(0)}%`
  );

  // ── r₂: Evidence freshness ──────────────────────────────────────────────
  if (features.f_conf_freshness_decay.present) {
    const r2 = features.f_conf_freshness_decay.value;
    reliabilities.push(r2);
    const freshLabel = r2 >= 0.8 ? 'fresh' : r2 >= 0.5 ? 'moderately fresh' : 'stale';
    contributing.push(`Evidence freshness: ${freshLabel} (r₂=${(r2 * 100).toFixed(0)}%)`);
  } else {
    missing.push('evidence_capture_date (freshness unknown — conservative estimate used)');
    // No date → we add a conservative prior instead of skipping
    reliabilities.push(0.50);
    contributing.push('Freshness unknown — conservative prior r₂=50%');
  }

  // ── r₃+: Corroboration from additional independent sources ──────────────
  const corrCount = features.f_conf_corroborating_count.present
    ? features.f_conf_corroborating_count.value
    : 0;

  if (corrCount > 0) {
    const effectiveCount = Math.min(corrCount, CORROBORATION_MAX_SOURCES);
    for (let i = 0; i < effectiveCount; i++) {
      // Each additional source adds a reliability signal with diminishing value
      const bonus = CORROBORATION_BONUS_PER_SOURCE * Math.pow(0.8, i);
      reliabilities.push(Math.min(0.70, bonus)); // cap each corroboration signal
    }
    contributing.push(`${corrCount} corroborating source(s) (de-duped by lineage)`);
  } else {
    missing.push('corroborating_source_ids (no cross-verification)');
  }

  // ── r_comp: Evidence completeness bonus ──────────────────────────────────
  if (features.f_conf_evidence_completeness.present) {
    const comp = features.f_conf_evidence_completeness.value;
    // Completeness gives a small boost to reliability, up to 0.40
    const completenessBonus = comp * 0.40;
    reliabilities.push(completenessBonus);
    contributing.push(`Evidence completeness: ${(comp * 100).toFixed(0)}% (r_comp=${(completenessBonus * 100).toFixed(0)}%)`);
  }

  // ── r_rep: Reputation / Social Proof bonus ───────────────────────────────
  if (features.f_conf_rating.present && features.f_conf_review_count.present) {
    const rating = features.f_conf_rating.value;
    const reviewCount = features.f_conf_review_count.value;
    
    // Scale review count logarithmically: 10 reviews = 1, 100 = 2, 1000 = 3
    const logReviews = reviewCount > 0 ? Math.log10(reviewCount) : 0;
    
    // Only boost if rating is decent (e.g., > 3.0) and there are some reviews
    if (rating >= 3.0 && logReviews > 0) {
      // Max boost of 0.60 for a 5-star with 1000+ reviews
      const repBonus = Math.min(0.60, (rating / 5) * (logReviews / 3) * 0.60);
      reliabilities.push(repBonus);
      contributing.push(`Public reputation: ${rating}★ from ${reviewCount} reviews (r_rep=${(repBonus * 100).toFixed(0)}%)`);
    } else {
      missing.push('reputation (rating below threshold or insufficient reviews)');
    }
  } else {
    missing.push('rating/review_count (no public reputation data)');
  }

  // ── Noisy-OR combination [PROVEN] ───────────────────────────────────────
  // CONF = 1 - Π(1 - rᵢ)
  let productOfComplements = 1.0;
  for (const r of reliabilities) {
    productOfComplements *= (1 - Math.max(0, Math.min(1, r)));
  }
  const score = Math.min(1.0, Math.max(0, 1 - productOfComplements));

  const reason = buildConfReason(score, corrCount);

  return {
    score,
    reason,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}

function buildConfReason(score: number, corrCount: number): string {
  if (score >= 0.80) {
    return corrCount > 0
      ? `High confidence — reliable source with ${corrCount} corroborating signal(s)`
      : 'High confidence — reliable source, fresh evidence';
  }
  if (score >= 0.60) return 'Medium-high confidence — source is moderately reliable';
  if (score >= 0.40) return 'Medium confidence — evidence is acceptable but limited';
  if (score >= 0.20) return 'Low confidence — weak or stale source';
  return 'Very low confidence — evidence unreliable';
}
