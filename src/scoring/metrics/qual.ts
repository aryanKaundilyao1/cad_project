/**
 * QUAL — Qualification Gate
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.6):
 *   Fit between the opportunity and JAS client's Ideal Customer Profile (ICP).
 *   This is a FILTER, not a ranking metric.
 *
 * Formula [PROVEN concept — conjunctive / non-compensatory model, Einhorn 1970]:
 *   QUAL = 1  if ALL applicable hard filters pass
 *   QUAL = 0  if ANY hard filter fails
 *
 * Non-compensatory means a perfect score on procurement cannot compensate
 * for wrong geography. Failing one gate = fail.
 *
 * Empty ICP arrays = that dimension is not gated (any value passes).
 * Absent evidence on a dimension = the gate is skipped (not failed).
 *   Rationale: we cannot disqualify a lead for data we don't have.
 *   A separate CONF score reflects the unreliability of absent data.
 *
 * Returns QualResult (see types.ts).
 */

import type { FeatureSet } from '../featureExtractor';
import type { QualResult } from '../types';
import { CLIENT_ICP, SIZE_BAND_ORDER, SizeBand } from '../config/scoring.config';
import { getSourceTier } from '../config/sourceHierarchy';

/** Normalise a string for comparison */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '_');
}

/** Check if a value matches any item in a list (normalised comparison) */
function matchesAny(value: string, list: string[]): boolean {
  if (list.length === 0) return true; // empty list → not gated
  const normValue = norm(value);
  return list.some(item => norm(item) === normValue || normValue.includes(norm(item)) || norm(item).includes(normValue));
}

/** Check if a size band meets or exceeds the minimum */
function meetsSizeBand(actual: SizeBand | string, minimum: SizeBand): boolean {
  const actualIdx = SIZE_BAND_ORDER.indexOf(actual as SizeBand);
  const minIdx = SIZE_BAND_ORDER.indexOf(minimum);
  if (actualIdx === -1) return false; // unknown band → fail
  return actualIdx >= minIdx;
}

export function scoreQUAL(features: FeatureSet): QualResult {
  const contributing: string[] = [];
  const missing: string[] = [];
  const failed_gates: string[] = [];
  const reasons: string[] = [];

  // ── Gate 1: Industry ───────────────────────────────────────────────────────
  if (CLIENT_ICP.qualifying_industries.length > 0) {
    if (features.f_qual_industry_code.present) {
      const industryValue = features.f_qual_industry_code.value;
      if (!matchesAny(industryValue, CLIENT_ICP.qualifying_industries)) {
        failed_gates.push('industry');
        reasons.push(`Industry "${industryValue}" is outside the ICP qualifying industries`);
      } else {
        contributing.push(`Industry "${industryValue}" matches ICP`);
      }
    } else {
      // Absent → skip gate (don't fail)
      missing.push('industry_code (industry gate not evaluated — data absent)');
    }
  }

  // ── Gate 2: Geography ──────────────────────────────────────────────────────
  if (CLIENT_ICP.qualifying_geographies.length > 0) {
    if (features.f_qual_geography.present) {
      const geoValue = features.f_qual_geography.value;
      if (!matchesAny(geoValue, CLIENT_ICP.qualifying_geographies)) {
        failed_gates.push('geography');
        reasons.push(`Geography "${geoValue}" is outside the ICP qualifying geographies`);
      } else {
        contributing.push(`Geography "${geoValue}" matches ICP`);
      }
    } else {
      missing.push('geography (geography gate not evaluated — data absent)');
    }
  }

  // ── Gate 3: Company Size ───────────────────────────────────────────────────
  if (CLIENT_ICP.minimum_size_band) {
    if (features.f_qual_size_band.present) {
      const sizeBand = features.f_qual_size_band.value;
      if (!meetsSizeBand(sizeBand, CLIENT_ICP.minimum_size_band)) {
        failed_gates.push('company_size');
        reasons.push(`Company size "${sizeBand}" is below ICP minimum "${CLIENT_ICP.minimum_size_band}"`);
      } else {
        contributing.push(`Company size "${sizeBand}" meets ICP minimum`);
      }
    } else {
      missing.push('company_size_band (size gate not evaluated — data absent)');
    }
  }

  // ── Gate 4: Budget Band ────────────────────────────────────────────────────
  if (CLIENT_ICP.minimum_budget_lakh !== null) {
    if (features.f_qual_budget_lakh.present) {
      const budget = features.f_qual_budget_lakh.value;
      if (budget < CLIENT_ICP.minimum_budget_lakh) {
        failed_gates.push('budget');
        reasons.push(`Budget estimate ₹${budget}L is below ICP minimum ₹${CLIENT_ICP.minimum_budget_lakh}L`);
      } else {
        contributing.push(`Budget estimate ₹${budget}L meets ICP minimum`);
      }
    } else {
      missing.push('budget_band_estimate (budget gate not evaluated — data absent, treat as low-confidence)');
    }
  }

  // ── Determine Tier & Result ────────────────────────────────────────────────
  let icp_tier: 'T1' | 'T2' | 'T3';
  const numFailed = failed_gates.length;
  const numMissing = missing.length;

  if (numFailed >= 2 || numMissing >= 3) {
    icp_tier = 'T3';
  } else if (numFailed === 1 || numMissing === 2) {
    icp_tier = 'T2';
  } else {
    // numFailed === 0 and numMissing <= 1
    icp_tier = 'T1';
  }

  // Explicit Source Penalization (e.g. Google Maps lacking commercial details)
  if (features.f_opp_source_key?.present) {
    const sourceTier = getSourceTier(features.f_opp_source_key.value);
    if (sourceTier.predictivePower < 0.2 && numMissing >= 1) {
      icp_tier = 'T3';
      reasons.push(`Downgraded to T3: Low-signal source (${sourceTier.name}) lacking complete commercial details.`);
      if (!failed_gates.includes('source_quality')) failed_gates.push('source_quality');
    }
  }

  const passed = failed_gates.length === 0;

  let finalReason = '';
  if (passed) {
    finalReason = contributing.length > 0 
      ? `Qualified: ${contributing.join('; ')}`
      : 'Lead passed all ICP gates (some dimensions not evaluated due to absent data)';
  } else {
    finalReason = `Failed gates: ${reasons.join('; ')}`;
  }

  return {
    passed,
    score: passed ? 1 : 0,
    reason: finalReason,
    failed_gates,
    icp_tier,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}
