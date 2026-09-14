/**
 * OIE Scoring Engine — External Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * All weights in this file are expert-judgment placeholders [EXPERT JUDGMENT]
 * pending AHP calibration (Specification Section 4, Stage 1).
 *
 * Do NOT inline these values into metric modules.
 * Updating this file is the ONLY change required to adjust weights.
 *
 * Score version must be bumped whenever weights change (Section 9, versioned
 * feature store requirement).
 */

// ─── Score Version ────────────────────────────────────────────────────────────

export const SCORE_VERSION = 'oie-v1.1.0';

// ─── PROC — Procurement Score weights ─────────────────────────────────────────
// Inputs: OIE Spec Section 2.1 + Task 2 field mapping
// All weights must sum to 1.0 across active features.
// Features with absent evidence are excluded from both numerator AND denominator.

export const PROC_WEIGHTS = {
  tender_recency: 0.15,            // how recently a tender was issued
  tender_frequency: 0.15,          // tender_count_trailing_12mo normalised
  tender_value: 0.15,              // avg_tender_value normalised by band
  procurement_hiring: 0.10,        // procurement_role_hiring_flag
  expansion_signal: 0.10,          // expansion_announcement_flag
  import_shipment: 0.05,           // import_shipment_count_trailing_12mo
  industry_base_rate: 0.05,        // industry_base_procurement_rate baseline
  project_status: 0.15,            // project_status planning vs ongoing
  procurement_stage: 0.10,         // rfq vs tender vs planning
};

// Industry-level base procurement rates (expert-set constants, [UNVALIDATED])
// Replace with computed values from JAS historical data once available (Section 9).
export const INDUSTRY_BASE_PROCUREMENT_RATE: Record<string, number> = {
  construction: 0.75,
  manufacturing: 0.70,
  infrastructure: 0.80,
  healthcare: 0.55,
  education: 0.40,
  retail: 0.35,
  it_software: 0.30,
  hospitality: 0.30,
  real_estate: 0.45,
  logistics: 0.60,
  export: 0.65,
  default: 0.40,
};

// Maximum tender value band for normalisation (₹ Crore)
// Leads with avg_tender_value ≥ this ceiling score 1.0 on value dimension
export const TENDER_VALUE_CEILING_CR = 100; // ₹100 Crore

// ─── CONT — Contactability Score weights ──────────────────────────────────────
// Spec Section 2.2: linear weighted sum

export const CONT_WEIGHTS = {
  email_verified_named: 0.25,      // verified email AND individual name (not generic)
  email_verified_generic: 0.15,    // verified email but generic (info@, etc.)
  email_present_unverified: 0.05,  // email present but not verified
  phone_verified: 0.15,            // phone present and verified
  phone_present: 0.05,             // phone present but not verified
  decision_maker_title: 0.10,      // decision_maker_title_match_flag
  prior_successful_contact: 0.15,  // prior_successful_contact_flag (CRM history)
  linkedin_present: 0.05,          // has linkedin
  website_present: 0.02,           // has website
  multiple_channels: 0.03,         // has both email and phone
  recency_decay_halflife_days: 180, // contact_last_verified_date decay (days)
};

// ─── CONF — Confidence Score ───────────────────────────────────────────────────
// Spec Section 2.3: noisy-OR combination [PROVEN]
// rᵢ values per source type — extraction method modifiers

export const CONF_EXTRACTION_MODIFIER: Record<string, number> = {
  vendor_api: 1.00,   // licensed vendor API — full reliability
  manual: 0.95,       // analyst-entered — very high but human error possible
  official_api: 0.90, // direct government/official API
  scraped_verified: 0.70, // scraped + verified post-hoc
  scraped: 0.50,      // raw scrape — moderate confidence
  email_parsed: 0.60, // parsed from email
  unknown: 0.40,
};

// Age decay: evidence older than this is penalised (exponential decay)
export const CONF_AGE_DECAY_HALFLIFE_DAYS = 90;

// ─── FIT — Commercial Fit ─────────────────────────────────────────────────────
// Spec Section 2.9: Jaccard similarity [PROVEN]
// No additional weights needed — Jaccard is parameter-free.
// FIT_MINIMUM_TAGS: if either tag set has fewer than this many tags,
// confidence in FIT score is degraded to Medium.
export const FIT_MINIMUM_TAGS = 2;

// ─── QUAL — Qualification Gate ────────────────────────────────────────────────
// Spec Section 2.6: conjunctive (non-compensatory) hard filters [PROVEN concept]
//
// ICP definition — edit this object to change qualification criteria.
// All fields are optional in the ICP; absent fields in the ICP mean that
// dimension is not gated (any value passes).
//
// client_icp_version must be bumped when the ICP changes, to enable
// retroactive scoring comparison.

export const CLIENT_ICP = {
  version: 'icp-v1.0.0',

  // Industries that qualify (NIC/NAICS-style codes or plain strings)
  // Empty array → any industry passes
  qualifying_industries: [
    'construction',
    'infrastructure',
    'manufacturing',
    'peb',          // pre-engineered buildings
    'epc',          // engineering, procurement, construction
    'real_estate',
    'logistics',
    'export',
    'industrial',
  ],

  // Geographies that qualify (state/city/country strings)
  // Empty array → any geography passes
  qualifying_geographies: [
    'india',
    'maharashtra',
    'gujarat',
    'rajasthan',
    'delhi',
    'ncr',
    'haryana',
    'karnataka',
    'tamil_nadu',
    'uae',
    'dubai',
  ],

  // Minimum company size band to qualify
  // Bands: 'micro' | 'small' | 'medium' | 'large' | 'enterprise'
  minimum_size_band: 'small' as const,

  // Minimum budget band estimate to qualify (₹ Lakhs)
  // null → no minimum
  minimum_budget_lakh: null as number | null,
};

export type SizeBand = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export const SIZE_BAND_ORDER: SizeBand[] = ['micro', 'small', 'medium', 'large', 'enterprise'];

// ─── RISK — Risk Score thresholds ─────────────────────────────────────────────
// Spec Section 2.10: rule-based flags

export const RISK_CONFIG = {
  // data_freshness_days above this → stale record flag
  max_acceptable_freshness_days: 180,

  // source_spam_rate above this → spam flag
  spam_rate_threshold: 0.30,

  // internal_complaint_count above this → complaint flag
  complaint_count_threshold: 1,

  // RISK score > this → lead is suppressed from ranking (still stored)
  suppression_threshold: 0.70,
};

// ─── OPP — Opportunity Strength ───────────────────────────────────────────────
// Spec Section 2.4: weighted combination of PROC + deal-size proxy

export const OPP_WEIGHTS = {
  proc_score: 0.40,               // procurement likelihood drives OPP
  deal_size_proxy: 0.30,          // tender_value or revenue band proxy
  urgency: 0.15,                  // deadline proximity
  funding_signal: 0.15,           // recent funding announcements
};

// Days until deadline: urgency bands
export const OPP_URGENCY_BANDS = {
  critical: 14,    // ≤14 days → urgency = 1.0
  high: 30,        // ≤30 days → urgency = 0.8
  medium: 90,      // ≤90 days → urgency = 0.5
  low: 180,        // ≤180 days → urgency = 0.2
  // beyond → urgency = 0.0
};

// OPP ordinal thresholds (numeric score → bucket)
export const OPP_THRESHOLDS = {
  high: 0.65,
  medium: 0.35,
  // below medium → Low
};

// ─── Aggregation ──────────────────────────────────────────────────────────────
// Spec Section 5: geometric mean at Stage B

// RISK suppression threshold — leads with risk_score above this are flagged
// but still scored (score is stored, but a suppressed flag is set)
export const AGGREGATION_RISK_SUPPRESSION_THRESHOLD = RISK_CONFIG.suppression_threshold;

// Minimum CONF required for a lead to be ranked (below this → Insufficient Data)
export const AGGREGATION_MIN_CONF = 0.10;
