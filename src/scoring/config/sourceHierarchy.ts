/**
 * Evidence Source Hierarchy
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the hierarchy table from:
 *   JAS CONNECT — Opportunity Intelligence Engine Specification v0.1, Section 3
 *   Evidence Source Acquisition Assessment (Task 1)
 *
 * Every numeric weight is an expert-judgment placeholder [EXPERT JUDGMENT].
 * These must be replaced by AHP-calibrated values once pairwise comparison
 * sessions with domain experts are completed (Specification Section 4, Stage 1).
 *
 * Reliability is normalised to [0,1]:
 *   High   → 0.90   Medium-High → 0.75   Medium → 0.55
 *   Low-Medium → 0.35   Low → 0.20   Very Low → 0.05
 *
 * Predictive power drives how much a source's evidence feeds PROC / OPP.
 * False-positive risk is inverted when used as a confidence penalty.
 */

export interface SourceTier {
  /** Canonical display name */
  name: string;
  /** Reliability normalised to [0,1] [EXPERT JUDGMENT] */
  reliability: number;
  /** Freshness half-life in days (after this many days evidence loses ~50% weight) */
  freshnessHalfLifeDays: number;
  /** Commercial significance [0,1] */
  significance: number;
  /** False-positive risk [0,1] — higher means more noise */
  falsePositiveRisk: number;
  /** Predictive power [0,1] — how well this source predicts a procurement event */
  predictivePower: number;
}

/** Internal key used in the lookup map */
export type SourceKey =
  | 'government_tender'
  | 'rfq_private'
  | 'import_export'
  | 'hiring_procurement'
  | 'expansion_announcement'
  | 'funding_round'
  | 'general_news'
  | 'website_update'
  | 'google_maps'
  | 'business_directory'
  | 'social_media'
  | 'manual_research'
  | 'unknown';

/**
 * Canonical hierarchy table.
 * Source: OIE Specification Section 3 + Task 1 acquisition assessment.
 */
export const SOURCE_HIERARCHY: Record<SourceKey, SourceTier> = {
  government_tender: {
    name: 'Government Tender / e-Procurement Portal',
    reliability: 0.90,
    freshnessHalfLifeDays: 14,       // bid deadlines are days–weeks
    significance: 0.95,
    falsePositiveRisk: 0.05,
    predictivePower: 0.90,
  },

  rfq_private: {
    name: 'RFQ (Private Company)',
    reliability: 0.85,
    freshnessHalfLifeDays: 21,       // short–medium lifecycle
    significance: 0.80,
    falsePositiveRisk: 0.15,
    predictivePower: 0.85,
  },

  import_export: {
    name: 'Import / Export Shipment Record',
    reliability: 0.75,
    freshnessHalfLifeDays: 60,       // shipment cadence weeks–months
    significance: 0.65,
    falsePositiveRisk: 0.10,
    predictivePower: 0.65,
  },

  hiring_procurement: {
    name: 'Hiring of Procurement / Purchasing Role',
    reliability: 0.55,
    freshnessHalfLifeDays: 45,       // role may take months to act
    significance: 0.50,
    falsePositiveRisk: 0.40,         // hiring ≠ imminent spend
    predictivePower: 0.50,
  },

  expansion_announcement: {
    name: 'Factory / Facility Expansion Announcement',
    reliability: 0.65,
    freshnessHalfLifeDays: 120,      // projects are slow
    significance: 0.70,
    falsePositiveRisk: 0.40,         // announcements delay/cancel
    predictivePower: 0.50,
  },

  funding_round: {
    name: 'Funding Round / Investment News',
    reliability: 0.55,
    freshnessHalfLifeDays: 90,       // correlates with future capex, not immediate
    significance: 0.45,
    falsePositiveRisk: 0.50,         // funding ≠ guaranteed spend timing
    predictivePower: 0.30,
  },

  general_news: {
    name: 'General News Mention',
    reliability: 0.35,
    freshnessHalfLifeDays: 7,        // news ages fast
    significance: 0.25,
    falsePositiveRisk: 0.65,
    predictivePower: 0.15,
  },

  website_update: {
    name: 'Company Website Update',
    reliability: 0.30,
    freshnessHalfLifeDays: 30,
    significance: 0.25,
    falsePositiveRisk: 0.60,
    predictivePower: 0.15,
  },

  google_maps: {
    name: 'Google Maps / Business Listing',
    reliability: 0.35,
    freshnessHalfLifeDays: 180,      // rarely changes
    significance: 0.15,
    falsePositiveRisk: 0.20,         // low-signal, not false — just weak
    predictivePower: 0.05,           // identity signal, not intent signal
  },

  business_directory: {
    name: 'Generic Business Directory',
    reliability: 0.20,
    freshnessHalfLifeDays: 180,
    significance: 0.15,
    falsePositiveRisk: 0.45,
    predictivePower: 0.05,
  },

  social_media: {
    name: 'Social Media Profile Activity',
    reliability: 0.20,
    freshnessHalfLifeDays: 3,
    significance: 0.10,
    falsePositiveRisk: 0.75,
    predictivePower: 0.05,
  },

  manual_research: {
    name: 'Manual Research (Analyst-Entered)',
    reliability: 0.90,              // human-verified
    freshnessHalfLifeDays: 30,
    significance: 0.80,
    falsePositiveRisk: 0.05,
    predictivePower: 0.75,
  },

  unknown: {
    name: 'Unknown Source',
    reliability: 0.20,
    freshnessHalfLifeDays: 30,
    significance: 0.10,
    falsePositiveRisk: 0.70,
    predictivePower: 0.05,
  },
};

/**
 * Alias map — maps raw CSV source strings to SourceKey.
 * All comparisons are case-insensitive after normalisation.
 * Add new aliases without changing any scoring logic.
 */
const SOURCE_ALIASES: Array<{ pattern: RegExp; key: SourceKey }> = [
  { pattern: /government\s*tender|e.?procurement|gem\b|cppp|tender\s*portal|state\s*portal/i, key: 'government_tender' },
  { pattern: /rfq|request\s*for\s*quotation|private\s*rfq/i, key: 'rfq_private' },
  { pattern: /import|export|shipment|customs|trade\s*data/i, key: 'import_export' },
  { pattern: /hiring|procurement\s*role|purchasing\s*role|job\s*post/i, key: 'hiring_procurement' },
  { pattern: /expansion|facility|factory|plant\s*announcement/i, key: 'expansion_announcement' },
  { pattern: /funding|investment\s*round|series\s*[a-e]/i, key: 'funding_round' },
  { pattern: /news(?!\s*letter)|press\s*release|media/i, key: 'general_news' },
  { pattern: /website|web\s*update|company\s*site|careers?\s*page/i, key: 'website_update' },
  { pattern: /google\s*maps?|maps?\s*listing|places?/i, key: 'google_maps' },
  { pattern: /directory|business\s*directory|yellow\s*pages|just\s*dial/i, key: 'business_directory' },
  { pattern: /social\s*media|linkedin|twitter|facebook|instagram/i, key: 'social_media' },
  { pattern: /manual|analyst|research|hand.?entered/i, key: 'manual_research' },
];

/** Resolve a raw source string to its SourceKey. Falls back to 'unknown'. */
export function resolveSourceKey(rawSource: string | null | undefined): SourceKey {
  if (!rawSource) return 'unknown';
  for (const { pattern, key } of SOURCE_ALIASES) {
    if (pattern.test(rawSource)) return key;
  }
  return 'unknown';
}

/** Get the SourceTier for a raw source string. */
export function getSourceTier(rawSource: string | null | undefined): SourceTier {
  return SOURCE_HIERARCHY[resolveSourceKey(rawSource)];
}
