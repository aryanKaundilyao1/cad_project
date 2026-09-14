/**
 * OIE Feature Extractor
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts a NormalizedEvidence object and produces a typed FeatureSet.
 *
 * Each feature is tagged as Present or Absent so metric modules can
 * distinguish "value is 0" from "value was never available".
 *
 * Naming convention:
 *   f_<metric>_<field>: Feature<T>
 *
 * Feature<T> = { present: true; value: T } | { present: false }
 */

import type { NormalizedEvidence } from './types';
import { daysSince } from './evidenceNormalizer';

// ─── Feature wrapper ──────────────────────────────────────────────────────────

export type Feature<T> =
  | { present: true; value: T }
  | { present: false };

export function present<T>(value: T): Feature<T> {
  return { present: true, value };
}

export function absent<T = never>(): Feature<T> {
  return { present: false };
}

/** Unwrap a feature, returning a fallback if absent. */
export function unwrap<T>(f: Feature<T>, fallback: T): T {
  return f.present ? f.value : fallback;
}

// ─── Decay helper ─────────────────────────────────────────────────────────────

/** Exponential freshness decay: returns [0,1] — 1.0 = brand new, decays with half-life */
export function freshnessDecay(days: number | null, halfLifeDays: number): number {
  if (days === null) return 0.5; // no date → neutral
  if (days <= 0) return 1.0;
  return Math.pow(0.5, days / halfLifeDays);
}

// ─── Feature Set ──────────────────────────────────────────────────────────────

export interface FeatureSet {
  // ── PROC Features ────────────────────────────────────────────────────────
  f_proc_tender_count: Feature<number>;
  f_proc_tender_recency_decay: Feature<number>;    // [0,1] decay of last_tender_date
  f_proc_avg_tender_value_norm: Feature<number>;   // [0,1] normalised by ceiling
  f_proc_category_tags: Feature<string[]>;
  f_proc_expansion_flag: Feature<boolean>;
  f_proc_expansion_recency_decay: Feature<number>;
  f_proc_hiring_flag: Feature<boolean>;
  f_proc_hiring_recency_decay: Feature<number>;
  f_proc_import_shipment_count: Feature<number>;
  f_proc_import_recency_decay: Feature<number>;
  f_proc_industry_base_rate: Feature<number>;      // [0,1]
  f_proc_source_predictive_power: Feature<number>; // [0,1] derived from source_tier
  f_proc_project_status: Feature<string>;
  f_proc_procurement_stage: Feature<string>;
  f_proc_project_type: Feature<string>;

  // ── CONT Features ────────────────────────────────────────────────────────
  f_cont_email_present: Feature<boolean>;
  f_cont_email_verified: Feature<boolean>;
  f_cont_email_type: Feature<string>;              // 'named' | 'generic' | other
  f_cont_phone_present: Feature<boolean>;
  f_cont_phone_verified: Feature<boolean>;
  f_cont_decision_maker_title: Feature<boolean>;
  f_cont_contact_recency_decay: Feature<number>;   // decay of contact_last_verified_date
  f_cont_prior_contact: Feature<boolean>;
  f_cont_linkedin_present: Feature<boolean>;
  f_cont_website_present: Feature<boolean>;
  f_cont_has_address: Feature<boolean>;

  // ── CONF Features ────────────────────────────────────────────────────────
  f_conf_source_reliability: Feature<number>;      // from source_tier
  f_conf_freshness_decay: Feature<number>;         // decay of data_freshness_days
  f_conf_corroborating_count: Feature<number>;
  f_conf_extraction_modifier: Feature<number>;     // per extraction method
  f_conf_evidence_completeness: Feature<number>;   // [0,1]
  f_conf_rating: Feature<number>;                  // 0-5 rating
  f_conf_review_count: Feature<number>;            // absolute number of reviews

  // ── FIT Features ─────────────────────────────────────────────────────────
  f_fit_opportunity_tags: Feature<string[]>;
  f_fit_certifications: Feature<string[]>;
  f_fit_business_type: Feature<string>;
  // client capability tags are injected by pipeline.ts from config, not from the lead

  // ── QUAL Features ─────────────────────────────────────────────────────────
  f_qual_industry_code: Feature<string>;
  f_qual_geography: Feature<string>;
  f_qual_size_band: Feature<string>;
  f_qual_budget_lakh: Feature<number>;

  // ── RISK Features ─────────────────────────────────────────────────────────
  f_risk_legal_status: Feature<string>;
  f_risk_duplicate_flag: Feature<boolean>;
  f_risk_complaint_count: Feature<number>;
  f_risk_tender_cancellation: Feature<boolean>;
  f_risk_source_spam_rate: Feature<number>;
  f_risk_data_freshness_days: Feature<number>;
  f_risk_website_dead: Feature<boolean>;
  f_risk_project_completed: Feature<boolean>;
  f_risk_project_cancelled: Feature<boolean>;

  // ── OPP Features ─────────────────────────────────────────────────────────
  f_opp_estimated_revenue_band: Feature<number>;  // ₹ Crore
  f_opp_tender_value: Feature<number>;            // ₹ Lakhs
  f_opp_urgency_days: Feature<number>;            // days until deadline
  f_opp_funding_announcement: Feature<boolean>;
  f_opp_source_key: Feature<string>;
}

// ─── Extractor ────────────────────────────────────────────────────────────────

import {
  CONF_EXTRACTION_MODIFIER,
  CONF_AGE_DECAY_HALFLIFE_DAYS,
  CONT_WEIGHTS,
  TENDER_VALUE_CEILING_CR,
} from './config/scoring.config';

/** Convert ₹ Lakhs to a normalised [0,1] value against the ₹ Crore ceiling */
function normaliseTenderValue(lakh: number): number {
  const crore = lakh / 100;
  return Math.min(1.0, crore / TENDER_VALUE_CEILING_CR);
}

export function extractFeatures(ev: NormalizedEvidence): FeatureSet {
  // ── PROC ───────────────────────────────────────────────────────────────────
  const f_proc_tender_count: Feature<number> =
    ev.tender_count_trailing_12mo != null
      ? present(ev.tender_count_trailing_12mo)
      : absent();

  const f_proc_tender_recency_decay: Feature<number> =
    ev.last_tender_date != null
      ? present(freshnessDecay(daysSince(ev.last_tender_date), ev.source_tier.freshnessHalfLifeDays))
      : absent();

  const f_proc_avg_tender_value_norm: Feature<number> =
    ev.avg_tender_value != null
      ? present(normaliseTenderValue(ev.avg_tender_value))
      : absent();

  const f_proc_category_tags: Feature<string[]> =
    ev.tender_category_tags != null && ev.tender_category_tags.length > 0
      ? present(ev.tender_category_tags)
      : absent();

  const f_proc_expansion_flag: Feature<boolean> =
    ev.expansion_announcement_flag != null
      ? present(ev.expansion_announcement_flag)
      : absent();

  const f_proc_expansion_recency_decay: Feature<number> =
    ev.expansion_announcement_date != null
      ? present(freshnessDecay(daysSince(ev.expansion_announcement_date), 120))
      : absent();

  const f_proc_hiring_flag: Feature<boolean> =
    ev.procurement_role_hiring_flag != null
      ? present(ev.procurement_role_hiring_flag)
      : absent();

  const f_proc_hiring_recency_decay: Feature<number> =
    ev.procurement_role_hiring_date != null
      ? present(freshnessDecay(daysSince(ev.procurement_role_hiring_date), 45))
      : absent();

  const f_proc_import_shipment_count: Feature<number> =
    ev.import_shipment_count_trailing_12mo != null
      ? present(ev.import_shipment_count_trailing_12mo)
      : absent();

  const f_proc_import_recency_decay: Feature<number> =
    ev.import_shipment_last_date != null
      ? present(freshnessDecay(daysSince(ev.import_shipment_last_date), 60))
      : absent();

  const f_proc_industry_base_rate: Feature<number> =
    ev.industry_base_procurement_rate != null
      ? present(Math.min(1.0, ev.industry_base_procurement_rate))
      : absent();

  const f_proc_source_predictive_power: Feature<number> =
    present(ev.source_tier.predictivePower); // always present - derived from source_tier

  const f_proc_project_status: Feature<string> =
    ev.project_status != null ? present(ev.project_status.toLowerCase()) : absent();

  const f_proc_procurement_stage: Feature<string> =
    ev.procurement_stage != null ? present(ev.procurement_stage.toLowerCase()) : absent();

  const f_proc_project_type: Feature<string> =
    ev.project_type != null ? present(ev.project_type.toLowerCase()) : absent();

  // ── CONT ───────────────────────────────────────────────────────────────────
  const f_cont_email_present: Feature<boolean> =
    ev.email_present_flag != null ? present(ev.email_present_flag) : absent();

  const f_cont_email_verified: Feature<boolean> =
    ev.email_verified_flag != null ? present(ev.email_verified_flag) : absent();

  const f_cont_email_type: Feature<string> =
    ev.email_type != null ? present(ev.email_type) : absent();

  const f_cont_phone_present: Feature<boolean> =
    ev.phone_present_flag != null ? present(ev.phone_present_flag) : absent();

  const f_cont_phone_verified: Feature<boolean> =
    ev.phone_verified_flag != null ? present(ev.phone_verified_flag) : absent();

  const f_cont_decision_maker_title: Feature<boolean> =
    ev.decision_maker_title_match_flag != null
      ? present(ev.decision_maker_title_match_flag)
      : absent();

  const f_cont_contact_recency_decay: Feature<number> =
    ev.contact_last_verified_date != null
      ? present(freshnessDecay(daysSince(ev.contact_last_verified_date), CONT_WEIGHTS.recency_decay_halflife_days))
      : absent();

  const f_cont_prior_contact: Feature<boolean> =
    ev.prior_successful_contact_flag != null
      ? present(ev.prior_successful_contact_flag)
      : absent();

  const f_cont_linkedin_present: Feature<boolean> =
    ev.linkedin_url !== undefined
      ? present(ev.linkedin_url !== null && ev.linkedin_url.toString().trim().length > 0)
      : absent();

  const f_cont_website_present: Feature<boolean> =
    ev.website !== undefined
      ? present(ev.website !== null && ev.website.toString().trim().length > 0)
      : absent();

  const f_cont_has_address: Feature<boolean> =
    (ev.address != null || ev.city != null || ev.state != null) ? present(true) : absent();

  // ── CONF ───────────────────────────────────────────────────────────────────
  const f_conf_source_reliability: Feature<number> =
    present(ev.source_tier.reliability); // always present — derived from source

  const f_conf_freshness_decay: Feature<number> =
    ev.data_freshness_days !== null
      ? present(freshnessDecay(ev.data_freshness_days, CONF_AGE_DECAY_HALFLIFE_DAYS))
      : absent();

  const f_conf_corroborating_count: Feature<number> =
    present(ev.corroborating_sources_deduped.length); // 0 is a valid value

  const extractionModifierRaw = CONF_EXTRACTION_MODIFIER[ev.resolved_extraction_method]
    ?? CONF_EXTRACTION_MODIFIER['unknown'];
  const f_conf_extraction_modifier: Feature<number> = present(extractionModifierRaw);

  const nonNullFields = Object.values(ev).filter(v => v !== null && v !== undefined && v !== '').length;
  // heuristic: 25 fields is considered very complete
  const completeness = Math.min(1.0, nonNullFields / 25);
  const f_conf_evidence_completeness: Feature<number> = present(completeness);

  const f_conf_rating: Feature<number> =
    (ev.rating != null || ev.google_rating != null)
      ? present(ev.rating || ev.google_rating || 0)
      : absent();

  const f_conf_review_count: Feature<number> =
    ev.review_count != null ? present(ev.review_count) : absent();

  // ── FIT ────────────────────────────────────────────────────────────────────
  const oppTags = ev.opportunity_requirement_tags && ev.opportunity_requirement_tags.length > 0 
    ? ev.opportunity_requirement_tags 
    : (ev.category ? [ev.category as string] : (ev.industry ? [ev.industry as string] : null));

  const f_fit_opportunity_tags: Feature<string[]> =
    oppTags != null
      ? present(oppTags)
      : absent();

  const f_fit_certifications: Feature<string[]> =
    ev.certifications != null && ev.certifications.length > 0 ? present(ev.certifications) : absent();

  const bizType = ev.business_type ?? ev.category ?? ev.industry;
  const f_fit_business_type: Feature<string> =
    bizType != null ? present(String(bizType).toLowerCase()) : absent();

  // ── QUAL ───────────────────────────────────────────────────────────────────
  // Prefer industry_code; fall back to industry field
  const industryRaw = ev.industry_code ?? ev.industry;
  const f_qual_industry_code: Feature<string> =
    industryRaw != null ? present(industryRaw.toLowerCase()) : absent();

  // Prefer geography; fall back to state → city → address
  const geoRaw = ev.geography ?? ev.state ?? ev.city;
  const f_qual_geography: Feature<string> =
    geoRaw != null ? present(geoRaw.toLowerCase()) : absent();

  const f_qual_size_band: Feature<string> =
    ev.company_size_band != null ? present(ev.company_size_band) : absent();

  const f_qual_budget_lakh: Feature<number> =
    ev.budget_band_estimate != null ? present(ev.budget_band_estimate) : absent();

  // ── RISK ───────────────────────────────────────────────────────────────────
  const f_risk_legal_status: Feature<string> =
    ev.company_legal_status != null ? present(ev.company_legal_status) : absent();

  const f_risk_duplicate_flag: Feature<boolean> =
    ev.duplicate_record_flag != null ? present(ev.duplicate_record_flag) : absent();

  const f_risk_complaint_count: Feature<number> =
    ev.internal_complaint_count != null ? present(ev.internal_complaint_count) : absent();

  const f_risk_tender_cancellation: Feature<boolean> =
    ev.tender_cancellation_history_flag != null
      ? present(ev.tender_cancellation_history_flag)
      : absent();

  const f_risk_source_spam_rate: Feature<number> =
    ev.source_spam_rate != null ? present(ev.source_spam_rate) : absent();

  const f_risk_data_freshness_days: Feature<number> =
    ev.data_freshness_days !== null ? present(ev.data_freshness_days) : absent();

  const f_risk_website_dead: Feature<boolean> =
    ev.website_dead_flag != null ? present(ev.website_dead_flag) : absent();

  const f_risk_project_completed: Feature<boolean> =
    ev.project_status?.toLowerCase() === 'completed' ? present(true) : absent();

  const f_risk_project_cancelled: Feature<boolean> =
    ev.project_status?.toLowerCase() === 'cancelled' ? present(true) : absent();

  // ── OPP ────────────────────────────────────────────────────────────────────
  const f_opp_estimated_revenue_band: Feature<number> =
    ev.estimated_company_revenue_band != null
      ? present(ev.estimated_company_revenue_band)
      : absent();

  const f_opp_tender_value: Feature<number> =
    ev.tender_value_if_known != null ? present(ev.tender_value_if_known) : absent();

  const f_opp_urgency_days: Feature<number> =
    ev.urgency_deadline_date != null
      ? present(Math.max(0, -(daysSince(ev.urgency_deadline_date) ?? 0))) // negative daysSince = future
      : absent();

  const f_opp_funding_announcement: Feature<boolean> =
    ev.funding_announcement_flag != null ? present(ev.funding_announcement_flag) : absent();

  const f_opp_source_key: Feature<string> =
    ev.source_key != null ? present(ev.source_key) : absent();

  // Special case: urgency_deadline_date is in the future, so we need to compute differently
  const f_opp_urgency_days_corrected: Feature<number> = (() => {
    if (!ev.urgency_deadline_date) return absent();
    const d = new Date(ev.urgency_deadline_date);
    if (isNaN(d.getTime())) return absent();
    const daysUntil = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return present(Math.max(0, daysUntil));
  })();

  return {
    f_proc_tender_count,
    f_proc_tender_recency_decay,
    f_proc_avg_tender_value_norm,
    f_proc_category_tags,
    f_proc_expansion_flag,
    f_proc_expansion_recency_decay,
    f_proc_hiring_flag,
    f_proc_hiring_recency_decay,
    f_proc_import_shipment_count,
    f_proc_import_recency_decay,
    f_proc_industry_base_rate,
    f_proc_source_predictive_power,
    f_proc_project_status,
    f_proc_procurement_stage,
    f_proc_project_type,

    f_cont_email_present,
    f_cont_email_verified,
    f_cont_email_type,
    f_cont_phone_present,
    f_cont_phone_verified,
    f_cont_decision_maker_title,
    f_cont_contact_recency_decay,
    f_cont_prior_contact,
    f_cont_linkedin_present,
    f_cont_website_present,
    f_cont_has_address,

    f_conf_source_reliability,
    f_conf_freshness_decay,
    f_conf_corroborating_count,
    f_conf_extraction_modifier,
    f_conf_evidence_completeness,
    f_conf_rating,
    f_conf_review_count,
    
    f_fit_opportunity_tags,
    f_fit_certifications,
    f_fit_business_type,

    f_qual_industry_code,
    f_qual_geography,
    f_qual_size_band,
    f_qual_budget_lakh,

    f_risk_legal_status,
    f_risk_duplicate_flag,
    f_risk_complaint_count,
    f_risk_tender_cancellation,
    f_risk_source_spam_rate,
    f_risk_data_freshness_days,
    f_risk_website_dead,
    f_risk_project_completed,
    f_risk_project_cancelled,

    f_opp_estimated_revenue_band,
    f_opp_tender_value,
    f_opp_urgency_days: f_opp_urgency_days_corrected,
    f_opp_funding_announcement,
    f_opp_source_key,
  };
}
