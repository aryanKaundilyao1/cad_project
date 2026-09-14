/**
 * FIT — Commercial Fit Score
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.9):
 *   How well the opportunity matches what this specific JAS client sells.
 *
 * Formula [PROVEN — Jaccard similarity]:
 *   FIT = |A ∩ B| / |A ∪ B|
 *   where A = client capability tags, B = opportunity requirement tags
 *
 * Tag matching is case-insensitive and normalised (whitespace collapsed).
 *
 * Confidence degrades to "Medium" if either tag set has fewer than
 * FIT_MINIMUM_TAGS tags (per scoring.config.ts).
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { MetricResult } from '../types';
import { FIT_MINIMUM_TAGS } from '../config/scoring.config';

/** Normalise a tag for case-insensitive comparison */
function normaliseTag(tag: string): string {
  return tag.toLowerCase().replace(/[\s\-_/]+/g, '_').trim();
}

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B|
 * Returns 0 if both sets are empty.
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

export function scoreFIT(
  features: FeatureSet,
  clientCapabilityTags: string[], // injected by pipeline from config/ICP
): MetricResult {
  const contributing: string[] = [];
  const missing: string[] = [];

  // Normalise client capability tags
  const clientTagsNorm = new Set(clientCapabilityTags.map(normaliseTag));

  // Normalise opportunity requirement tags
  let oppTagsNorm: Set<string>;
  if (features.f_fit_opportunity_tags.present) {
    oppTagsNorm = new Set(features.f_fit_opportunity_tags.value.map(normaliseTag));
  } else {
    missing.push('opportunity_requirement_tags (not provided for this source type)');
    oppTagsNorm = new Set();
  }

  // Handle edge cases
  if (clientTagsNorm.size === 0) {
    missing.push('client_capability_tags (ICP not configured)');
    return {
      score: 0,
      reason: 'FIT cannot be computed — client capability tags not configured in ICP',
      contributing_evidence: contributing,
      missing_evidence: missing,
    };
  }

  if (oppTagsNorm.size === 0 && !features.f_fit_certifications.present && !features.f_fit_business_type.present) {
    // Distinguish: tags field was absent (source doesn't produce them) vs present but empty
    // If field was absent → FIT is not computable for this source → return score null
    // so pipeline treats it as 1.0 (neutral) instead of 0 (fatal penalty)
    const tagsAbsent = !features.f_fit_opportunity_tags.present;
    return {
      score: tagsAbsent ? (null as unknown as number) : 0,
      reason: tagsAbsent
        ? 'FIT not computable — this source type does not produce requirement tags (neutral)'
        : 'FIT score is 0 — opportunity requirement tags present but empty',
      contributing_evidence: contributing,
      missing_evidence: missing,
    };
  }

  // Compute Jaccard similarity for tags
  let score = jaccardSimilarity(clientTagsNorm, oppTagsNorm);
  
  // ── Certifications matching ────────────────────────────────────────────────
  if (features.f_fit_certifications.present) {
    const certs = features.f_fit_certifications.value.map(normaliseTag);
    // Add bonus if certifications match client tags
    let certMatches = 0;
    for (const cert of certs) {
      if (clientTagsNorm.has(cert)) certMatches++;
    }
    if (certMatches > 0) {
      contributing.push(`Matching certifications: ${certMatches}`);
      score = Math.min(1.0, score + (certMatches * 0.15)); // Boost score
    } else {
      contributing.push('Certifications present but do not match client capabilities directly');
    }
  } else {
    missing.push('certifications');
  }

  // ── Business Type matching ─────────────────────────────────────────────────
  if (features.f_fit_business_type.present) {
    const bt = normaliseTag(features.f_fit_business_type.value);
    if (clientTagsNorm.has(bt)) {
      contributing.push(`Business type '${bt}' matches client capabilities`);
      score = Math.min(1.0, score + 0.20);
    }
  } else {
    missing.push('business_type');
  }

  // Identify intersection for explanation
  const intersection: string[] = [];
  for (const tag of clientTagsNorm) {
    if (oppTagsNorm.has(tag)) intersection.push(tag);
  }

  if (intersection.length > 0) {
    contributing.push(`Matching tags: ${intersection.join(', ')}`);
  }
  contributing.push(
    `Jaccard = ${intersection.length} / (${clientTagsNorm.size} + ${oppTagsNorm.size} - ${intersection.length}) = ${score.toFixed(3)}`
  );

  // Confidence note for small tag sets
  if (clientTagsNorm.size < FIT_MINIMUM_TAGS || oppTagsNorm.size < FIT_MINIMUM_TAGS) {
    missing.push(
      `Tag set is small (client: ${clientTagsNorm.size}, opportunity: ${oppTagsNorm.size}) — FIT confidence is reduced`
    );
  }

  const reason = buildFitReason(score, intersection.length);

  return {
    score,
    reason,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}

function buildFitReason(score: number, matchCount: number): string {
  if (score >= 0.70) return `Excellent commercial fit — ${matchCount} tag(s) match client capabilities`;
  if (score >= 0.40) return `Good commercial fit — partial tag overlap with client capabilities`;
  if (score >= 0.15) return `Partial commercial fit — limited tag overlap`;
  if (score > 0) return `Weak commercial fit — minimal tag overlap`;
  return 'No commercial fit — no tag overlap with client capabilities';
}
