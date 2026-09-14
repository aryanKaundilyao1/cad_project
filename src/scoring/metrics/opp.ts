/**
 * OPP — Opportunity Strength
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.4):
 *   Composite measure of how commercially significant the opportunity is,
 *   regardless of contactability.
 *
 * Inputs: Derived metric — consumes PROC output + deal-size proxy fields.
 *   No new raw fields are consumed that aren't already in the feature store.
 *
 * Formula (structural — weights from scoring.config.ts):
 *   OPP = w_proc × PROC + w_deal × deal_size_normalised + w_urgency × urgency
 *
 * Returns:
 *   OppResult with numeric score [0,1] AND ordinal bucket (Low/Med/High)
 *   Per spec recommendation [EXPERT JUDGMENT]: ordinal bucket avoids false
 *   precision from high-variance deal-size estimation.
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { OppResult, OppBucket } from '../types';
import { OPP_WEIGHTS, OPP_URGENCY_BANDS, OPP_THRESHOLDS, TENDER_VALUE_CEILING_CR } from '../config/scoring.config';

/** Normalise deal size to [0,1] */
function normaliseDealSize(features: FeatureSet): { value: number; label: string } | null {
  // Prefer tender_value_if_known (hard fact) over estimated_company_revenue_band (proxy)
  if (features.f_opp_tender_value.present) {
    const lakh = features.f_opp_tender_value.value;
    const crore = lakh / 100;
    const norm = Math.min(1.0, crore / TENDER_VALUE_CEILING_CR);
    return { value: norm, label: `Tender value ₹${lakh}L (normalised: ${(norm * 100).toFixed(0)}%)` };
  }

  if (features.f_opp_estimated_revenue_band.present) {
    // Revenue band proxy: ₹ Crore. 500+ Cr = 1.0
    const revCr = features.f_opp_estimated_revenue_band.value;
    const norm = Math.min(1.0, revCr / 500);
    return { value: norm, label: `Revenue band proxy ₹${revCr}Cr (normalised: ${(norm * 100).toFixed(0)}%)` };
  }

  return null; // deal size unknown
}

/** Urgency score from days until deadline */
function urgencyScore(daysUntil: number): number {
  if (daysUntil <= OPP_URGENCY_BANDS.critical) return 1.00;
  if (daysUntil <= OPP_URGENCY_BANDS.high) return 0.80;
  if (daysUntil <= OPP_URGENCY_BANDS.medium) return 0.50;
  if (daysUntil <= OPP_URGENCY_BANDS.low) return 0.20;
  return 0.00;
}

/** Convert numeric score to ordinal bucket */
function toBucket(score: number): OppBucket {
  if (score >= OPP_THRESHOLDS.high) return 'High';
  if (score >= OPP_THRESHOLDS.medium) return 'Medium';
  return 'Low';
}

export function scoreOPP(features: FeatureSet, procScore: number): OppResult {
  const contributing: string[] = [];
  const missing: string[] = [];

  let weightedSum = 0;
  let presentWeightSum = 0;

  // ── PROC component (always present — passed in from pipeline) ────────────
  weightedSum += OPP_WEIGHTS.proc_score * procScore;
  presentWeightSum += OPP_WEIGHTS.proc_score;
  contributing.push(`Procurement likelihood: ${(procScore * 100).toFixed(0)}%`);

  // ── Deal size component ───────────────────────────────────────────────────
  const dealSize = normaliseDealSize(features);
  if (dealSize) {
    weightedSum += OPP_WEIGHTS.deal_size_proxy * dealSize.value;
    presentWeightSum += OPP_WEIGHTS.deal_size_proxy;
    contributing.push(dealSize.label);
  } else {
    missing.push('tender_value_if_known / estimated_company_revenue_band (deal size unknown)');
  }

  // ── Urgency component ─────────────────────────────────────────────────────
  if (features.f_opp_urgency_days.present) {
    const days = features.f_opp_urgency_days.value;
    const urgency = urgencyScore(days);
    weightedSum += OPP_WEIGHTS.urgency * urgency;
    presentWeightSum += OPP_WEIGHTS.urgency;

    const urgencyLabel =
      urgency >= 1.0 ? 'Critical urgency' :
      urgency >= 0.80 ? 'High urgency' :
      urgency >= 0.50 ? 'Medium urgency' :
      urgency >= 0.20 ? 'Low urgency' : 'No urgency';
    contributing.push(`Deadline in ${days} day(s) — ${urgencyLabel} (score: ${(urgency * 100).toFixed(0)}%)`);
  } else {
    missing.push('urgency_deadline_date (no deadline to assess urgency)');
  }

  // ── Funding component ───────────────────────────────────────────────────────
  if (features.f_opp_funding_announcement.present && features.f_opp_funding_announcement.value) {
    weightedSum += OPP_WEIGHTS.funding_signal;
    presentWeightSum += OPP_WEIGHTS.funding_signal;
    contributing.push('Recent funding announcement detected');
  } else if (features.f_opp_funding_announcement.present && !features.f_opp_funding_announcement.value) {
    presentWeightSum += OPP_WEIGHTS.funding_signal;
  } else {
    missing.push('funding_announcement_flag');
  }

  // ── Final score ────────────────────────────────────────────────────────────
  const score = presentWeightSum > 0 ? Math.min(1.0, Math.max(0, weightedSum / presentWeightSum)) : 0;
  const bucket = toBucket(score);

  const reason = buildOppReason(score, bucket, contributing);

  return {
    score,
    bucket,
    reason,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}

function buildOppReason(score: number, bucket: OppBucket, evidence: string[]): string {
  const evidenceSummary = evidence.slice(0, 2).join('; ');
  return `Opportunity strength: ${bucket} (${(score * 100).toFixed(0)}%) — ${evidenceSummary}`;
}
