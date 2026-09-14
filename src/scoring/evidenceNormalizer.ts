/**
 * OIE Evidence Normalizer
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts a raw lead record into a NormalizedEvidence object ready for
 * feature extraction and metric computation.
 *
 * Responsibilities:
 *   1. Resolve source string → SourceKey + SourceTier
 *   2. Compute data_freshness_days from evidence_capture_date
 *   3. Normalise extraction_method to a canonical string
 *   4. De-duplicate corroborating sources by lineage (not just count)
 *   5. Set email presence flags from raw email field if flags are absent
 *   6. Set phone presence flag from raw phone field if absent
 *
 * CRITICAL: This normalizer must NEVER default missing numeric fields to 0.
 *   Missing evidence is `undefined` — not zero.
 */

import { resolveSourceKey, getSourceTier } from './config/sourceHierarchy';
import type { RawLeadRecord, NormalizedEvidence } from './types';

// ─── Extraction method normalisation ─────────────────────────────────────────

const EXTRACTION_METHOD_ALIASES: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /vendor|licensed/i, canonical: 'vendor_api' },
  { pattern: /manual|analyst|hand.?enter/i, canonical: 'manual' },
  { pattern: /official.?api|gov.?api/i, canonical: 'official_api' },
  { pattern: /scraped?.?verif/i, canonical: 'scraped_verified' },
  { pattern: /scrape|crawl/i, canonical: 'scraped' },
  { pattern: /email.?pars/i, canonical: 'email_parsed' },
  { pattern: /api/i, canonical: 'vendor_api' },
];

function normaliseExtractionMethod(raw: string | undefined): string {
  if (!raw) return 'unknown';
  for (const { pattern, canonical } of EXTRACTION_METHOD_ALIASES) {
    if (pattern.test(raw)) return canonical;
  }
  return 'unknown';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the number of calendar days between dateStr and now. Null if unparseable. */
export function daysSince(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// ─── Main normaliser ──────────────────────────────────────────────────────────

/**
 * Normalises a raw lead record into a feature-store–ready NormalizedEvidence object.
 * Does NOT mutate the input.
 */
export function normalizeEvidence(raw: RawLeadRecord): NormalizedEvidence {
  const source_key = resolveSourceKey(raw.source);
  const source_tier = getSourceTier(raw.source);

  // Freshness: prefer evidence_capture_date; fall back to last_tender_date
  const captureDateStr = raw.evidence_capture_date || raw.last_tender_date;
  const data_freshness_days = daysSince(captureDateStr);

  // Extraction method
  const resolved_extraction_method = normaliseExtractionMethod(raw.extraction_method);

  // Corroborating sources — de-duplicate by lineage
  const rawIds = raw.corroborating_source_ids ?? [];
  const corroborating_sources_deduped = Array.from(new Set(rawIds));

  // Infer email presence flags from the email field if explicit flags are absent
  let email_present_flag = raw.email_present_flag;
  if (email_present_flag === undefined && raw.email !== undefined) {
    email_present_flag = raw.email !== null && raw.email.toString().trim().length > 0;
  }

  // Infer phone presence from phone field if absent
  let phone_present_flag = raw.phone_present_flag;
  if (phone_present_flag === undefined && raw.phone !== undefined) {
    phone_present_flag = raw.phone !== null && raw.phone.toString().trim().length > 0;
  }

  // Infer email_type: if email looks like info@, contact@, admin@, etc. → generic
  let email_type = raw.email_type;
  if (!email_type && raw.email) {
    const genericPrefixes = /^(info|contact|admin|support|sales|hello|enquir|query|noreply|no-reply|office|mail|help)@/i;
    email_type = genericPrefixes.test(raw.email) ? 'generic' : 'named';
  }

  return {
    // Spread all original fields (preserves any extra columns)
    ...raw,

    // Override with inferred values (non-destructively)
    email_present_flag,
    phone_present_flag,
    email_type,

    // Computed fields
    source_key,
    source_tier,
    data_freshness_days,
    resolved_extraction_method,
    corroborating_sources_deduped,
  };
}
