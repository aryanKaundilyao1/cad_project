/**
 * OIE Scoring Engine — Shared TypeScript Types
 * ─────────────────────────────────────────────────────────────────────────────
 * All interfaces explicitly mark fields as optional to reflect the
 * specification's core rule: "Missing evidence is NOT zero — it is
 * simply unavailable."
 *
 * Every metric module must handle `undefined` for every field.
 * Do NOT assign default values to missing evidence inside metric modules —
 * handle absence explicitly in the scoring logic.
 */

import type { SourceKey, SourceTier } from './config/sourceHierarchy';
import type { SizeBand } from './config/scoring.config';

// ─── Raw Lead Record ──────────────────────────────────────────────────────────
// Represents a single row as it arrives from a CSV upload or ingestion connector.
// Fields are sparse by design — different sources populate different subsets.

export interface RawLeadRecord {
  // ── Identity ──────────────────────────────────────────────────────────────
  id?: string;
  company_name?: string;
  source: string; // REQUIRED — the only field guaranteed to exist

  // ── PROC fields (Task 2, Specification Section 2.1) ──────────────────────
  tender_count_trailing_12mo?: number;
  last_tender_date?: string;           // ISO date string
  avg_tender_value?: number;           // in ₹ Lakhs
  tender_category_tags?: string[];
  expansion_announcement_flag?: boolean;
  expansion_announcement_date?: string;
  procurement_role_hiring_flag?: boolean;
  procurement_role_hiring_date?: string;
  import_shipment_count_trailing_12mo?: number;
  import_shipment_last_date?: string;
  industry_base_procurement_rate?: number; // segment-level [UNVALIDATED]
  project_status?: 'planning' | 'ongoing' | 'completed' | 'cancelled' | string;
  procurement_stage?: 'rfq' | 'tender' | 'planning' | string;
  project_type?: 'factory' | 'warehouse' | 'expansion' | 'new_construction' | string;

  // ── CONT fields ───────────────────────────────────────────────────────────
  email?: string;
  email_present_flag?: boolean;
  email_verified_flag?: boolean;
  email_type?: 'named' | 'generic' | string; // generic = info@, etc.
  phone?: string;
  phone_present_flag?: boolean;
  phone_verified_flag?: boolean;
  decision_maker_title_match_flag?: boolean;
  contact_last_verified_date?: string;
  prior_successful_contact_flag?: boolean;

  // ── CONF fields ───────────────────────────────────────────────────────────
  evidence_capture_date?: string;       // when this record was collected
  corroborating_source_count?: number;
  corroborating_source_ids?: string[];  // for lineage de-dup, not just count
  extraction_method?: string;           // 'api' | 'vendor' | 'manual' | 'scraped'

  // ── FIT fields ────────────────────────────────────────────────────────────
  opportunity_requirement_tags?: string[]; // parsed from tender/RFQ text
  certifications?: string[];
  business_type?: 'manufacturer' | 'distributor' | 'consultant' | string;
  // client_capability_tags come from scoring config / ICP, not the lead record

  // ── QUAL fields ───────────────────────────────────────────────────────────
  industry_code?: string;               // NIC/NAICS-equivalent or plain string
  geography?: string;                   // state / city / country
  company_size_band?: SizeBand;
  budget_band_estimate?: number;        // ₹ Lakhs, low-confidence estimate

  // ── RISK fields ───────────────────────────────────────────────────────────
  company_legal_status?: 'active' | 'struck_off' | 'dormant' | string;
  duplicate_record_flag?: boolean;
  internal_complaint_count?: number;
  tender_cancellation_history_flag?: boolean;
  source_spam_rate?: number;            // [0,1] tracked internally per source
  website_dead_flag?: boolean;

  // ── OPP-specific (deal-size proxies) ─────────────────────────────────────
  estimated_company_revenue_band?: number; // ₹ Crore, rough proxy
  tender_value_if_known?: number;          // ₹ Lakhs, from tender record
  urgency_deadline_date?: string;          // ISO date, procurement deadline
  funding_announcement_flag?: boolean;

  // ── Additional identity/context ───────────────────────────────────────────
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  rating?: number;
  google_rating?: number;
  review_count?: number;
  website?: string;
  linkedin_url?: string;
  notes?: string;
  [key: string]: unknown;             // allow extra fields without type errors
}

// ─── Normalized Evidence ──────────────────────────────────────────────────────
// The output of evidenceNormalizer.ts — a feature-store row ready for metric computation.

export interface NormalizedEvidence extends RawLeadRecord {
  // Computed by normalizer
  source_key: SourceKey;
  source_tier: SourceTier;
  data_freshness_days: number | null;  // null if evidence_capture_date absent
  resolved_extraction_method: string;  // normalised extraction method string
  corroborating_sources_deduped: string[]; // lineage-deduped source IDs
}

// ─── Metric Result ────────────────────────────────────────────────────────────
// Standard output shape for every metric module.

export interface MetricResult {
  score: number;                        // [0,1] unless noted
  reason: string;                       // one-line human-readable summary
  contributing_evidence: string[];      // what drove the score up
  missing_evidence: string[];           // fields absent that would have helped
}

// ─── Qualification Result ─────────────────────────────────────────────────────

export interface QualResult {
  passed: boolean;                      // true → continue pipeline
  score: 0 | 1;
  reason: string;
  failed_gates?: string[];              // which hard filters failed (if any)
  icp_tier?: 'T1' | 'T2' | 'T3';
  contributing_evidence: string[];
  missing_evidence: string[];
}

// ─── OPP Bucket ──────────────────────────────────────────────────────────────

export type OppBucket = 'High' | 'Medium' | 'Low';

export interface OppResult extends MetricResult {
  bucket: OppBucket;
}

// ─── Full Lead Score Result ───────────────────────────────────────────────────
// Stored for every scored lead (Specification storage requirements).

export interface LeadScoreResult {
  // Identity
  lead_id: string;
  company_name: string;
  source: string;
  source_key: SourceKey;

  // Gate result
  qualification_passed: boolean;
  qual_result: QualResult;
  icp_tier?: 'T1' | 'T2' | 'T3';

  // Sub-scores (all [0,1], stored even if QUAL fails)
  proc_score: number | null;
  cont_score: number | null;
  conf_score: number | null;
  fit_score: number | null;
  qual_score: number | null; // 0 or 1
  risk_score: number | null;
  opp_score: number | null;
  opp_bucket: OppBucket | null;

  // Aggregated lead score [0–100] — the only score users see
  lead_score: number | null;

  // Suppression/Qualification flags
  risk_suppressed: boolean;
  outreach_eligible: boolean;
  qual_passed: boolean;

  // Storage helper fields
  source_used: string;
  evidence_used: string[];
  evidence_capture_date: string | null;

  // Full breakdown for storage and explainability
  score_breakdown: {
    proc?: MetricResult;
    cont?: MetricResult;
    conf?: MetricResult;
    fit?: MetricResult;
    risk?: MetricResult;
    opp?: OppResult;
  };

  // Aggregation-level explanation (what users see)
  explanation: string;
  explanation_bullets: string[];

  // Metadata
  score_version: string;
  pipeline_timestamp: string;           // ISO datetime
}

// ─── Pipeline Ranking ─────────────────────────────────────────────────────────

export interface RankedLead {
  rank: number;
  lead_score: number;
  lead_id: string;
  company_name: string;
  source: string;
  opp_bucket: OppBucket | null;
  qualification_passed: boolean;
  risk_suppressed: boolean;
  explanation: string;
}
