/**
 * PROC — Procurement Score
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.1):
 *   Likelihood a company will issue a procurement event (RFQ, tender, PO)
 *   in a defined window (e.g., 90 days).
 *
 * Formula (structural — weights from scoring.config.ts):
 *   PROC = weighted_sum(xᵢ) / sum_of_present_weights
 *   where xᵢ = normalised evidence feature for present fields only.
 *
 *   Missing evidence is excluded from both numerator AND denominator —
 *   it does not act as a zero.  [EXPERT JUDGMENT — structural form]
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { MetricResult } from '../types';
import { PROC_WEIGHTS, INDUSTRY_BASE_PROCUREMENT_RATE } from '../config/scoring.config';
import { unwrap } from '../featureExtractor';

/** Normalise tender count to [0,1]: 1 tender = 0.2, 5+ = 1.0 */
function normaliseTenderCount(count: number): number {
  return Math.min(1.0, count / 5);
}

/** Resolve industry_base_procurement_rate from config if not in features */
export function resolveBaseRate(industryCode: string | undefined): number {
  if (!industryCode) return INDUSTRY_BASE_PROCUREMENT_RATE['default'];
  const key = industryCode.toLowerCase().replace(/[\s-]/g, '_');
  return INDUSTRY_BASE_PROCUREMENT_RATE[key] ?? INDUSTRY_BASE_PROCUREMENT_RATE['default'];
}

export function scorePROC(
  features: FeatureSet,
  industryCodeHint?: string,
): MetricResult {
  const contributing: string[] = [];
  const missing: string[] = [];

  let weightedSum = 0;
  let presentWeightSum = 0;

  // ── tender_recency ──────────────────────────────────────────────────────────
  if (features.f_proc_tender_recency_decay.present) {
    const v = features.f_proc_tender_recency_decay.value;
    weightedSum += PROC_WEIGHTS.tender_recency * v;
    presentWeightSum += PROC_WEIGHTS.tender_recency;
    contributing.push(`Tender recency decay: ${(v * 100).toFixed(0)}%`);
  } else {
    missing.push('last_tender_date (no recent tender record)');
  }

  // ── tender_frequency ────────────────────────────────────────────────────────
  if (features.f_proc_tender_count.present) {
    const count = features.f_proc_tender_count.value;
    const v = normaliseTenderCount(count);
    weightedSum += PROC_WEIGHTS.tender_frequency * v;
    presentWeightSum += PROC_WEIGHTS.tender_frequency;
    contributing.push(`${count} tender(s) in trailing 12 months (normalised: ${(v * 100).toFixed(0)}%)`);
  } else {
    missing.push('tender_count_trailing_12mo');
  }

  // ── tender_value ────────────────────────────────────────────────────────────
  if (features.f_proc_avg_tender_value_norm.present) {
    const v = features.f_proc_avg_tender_value_norm.value;
    weightedSum += PROC_WEIGHTS.tender_value * v;
    presentWeightSum += PROC_WEIGHTS.tender_value;
    contributing.push(`Average tender value normalised: ${(v * 100).toFixed(0)}%`);
  } else {
    missing.push('avg_tender_value');
  }

  // ── procurement_hiring ──────────────────────────────────────────────────────
  if (features.f_proc_hiring_flag.present && features.f_proc_hiring_flag.value) {
    // Modulate by recency if available
    const recency = features.f_proc_hiring_recency_decay.present
      ? features.f_proc_hiring_recency_decay.value
      : 0.7; // no date → moderate
    const v = recency;
    weightedSum += PROC_WEIGHTS.procurement_hiring * v;
    presentWeightSum += PROC_WEIGHTS.procurement_hiring;
    contributing.push(`Procurement role hiring detected (recency weight: ${(v * 100).toFixed(0)}%)`);
  } else if (features.f_proc_hiring_flag.present && !features.f_proc_hiring_flag.value) {
    // Flag present but false — add weight, contribute 0
    presentWeightSum += PROC_WEIGHTS.procurement_hiring;
  } else {
    missing.push('procurement_role_hiring_flag');
  }

  // ── expansion_signal / project_type ─────────────────────────────────────────
  let expansionValue = 0;
  if (features.f_proc_expansion_flag.present && features.f_proc_expansion_flag.value) {
    expansionValue = features.f_proc_expansion_recency_decay.present
      ? features.f_proc_expansion_recency_decay.value
      : 0.5;
    contributing.push(`Expansion/facility announcement detected (recency: ${(expansionValue * 100).toFixed(0)}%)`);
  } else if (features.f_proc_project_type.present) {
    const type = features.f_proc_project_type.value;
    if (type === 'factory' || type === 'warehouse' || type === 'expansion' || type === 'new_construction') {
      expansionValue = 0.8; // Strong indicator similar to announcement
      contributing.push(`Project type '${type}' indicates expansion/facility build`);
    }
  }

  if (expansionValue > 0) {
    weightedSum += PROC_WEIGHTS.expansion_signal * expansionValue;
    presentWeightSum += PROC_WEIGHTS.expansion_signal;
  } else if (features.f_proc_expansion_flag.present || features.f_proc_project_type.present) {
    presentWeightSum += PROC_WEIGHTS.expansion_signal; // Present but false/other
  } else {
    missing.push('expansion_announcement_flag / project_type');
  }

  // ── import_shipment ──────────────────────────────────────────────────────────
  if (features.f_proc_import_shipment_count.present) {
    const count = features.f_proc_import_shipment_count.value;
    const v = Math.min(1.0, count / 10); // 10+ shipments = 1.0
    const recency = features.f_proc_import_recency_decay.present
      ? features.f_proc_import_recency_decay.value
      : 0.5;
    const combined = v * recency;
    weightedSum += PROC_WEIGHTS.import_shipment * combined;
    presentWeightSum += PROC_WEIGHTS.import_shipment;
    contributing.push(`${count} import shipment(s) in trailing 12 months`);
  } else {
    missing.push('import_shipment_count_trailing_12mo');
  }

  // ── industry_base_rate ───────────────────────────────────────────────────────
  let baseRate: number;
  if (features.f_proc_industry_base_rate.present) {
    baseRate = features.f_proc_industry_base_rate.value;
    contributing.push(`Industry base procurement rate: ${(baseRate * 100).toFixed(0)}%`);
  } else {
    baseRate = resolveBaseRate(
      features.f_qual_industry_code.present ? features.f_qual_industry_code.value : industryCodeHint,
    );
    contributing.push(`Industry base rate (config fallback): ${(baseRate * 100).toFixed(0)}%`);
  }
  weightedSum += PROC_WEIGHTS.industry_base_rate * baseRate;
  presentWeightSum += PROC_WEIGHTS.industry_base_rate;

  // ── project_status ───────────────────────────────────────────────────────────
  if (features.f_proc_project_status.present) {
    const status = features.f_proc_project_status.value;
    let statusScore = 0.5; // default unknown
    if (status === 'ongoing') statusScore = 1.0;
    else if (status === 'planning') statusScore = 0.8;
    else if (status === 'completed' || status === 'cancelled') statusScore = 0.0;
    
    weightedSum += PROC_WEIGHTS.project_status * statusScore;
    presentWeightSum += PROC_WEIGHTS.project_status;
    contributing.push(`Project status '${status}' (score: ${(statusScore * 100).toFixed(0)}%)`);
  } else {
    missing.push('project_status');
  }

  // ── procurement_stage ────────────────────────────────────────────────────────
  if (features.f_proc_procurement_stage.present) {
    const stage = features.f_proc_procurement_stage.value;
    let stageScore = 0.5;
    if (stage === 'rfq') stageScore = 1.0;
    else if (stage === 'tender') stageScore = 0.9;
    else if (stage === 'planning') stageScore = 0.5;
    
    weightedSum += PROC_WEIGHTS.procurement_stage * stageScore;
    presentWeightSum += PROC_WEIGHTS.procurement_stage;
    contributing.push(`Procurement stage '${stage}' (score: ${(stageScore * 100).toFixed(0)}%)`);
  } else {
    missing.push('procurement_stage');
  }

  // ── Final score ──────────────────────────────────────────────────────────────
  const score = presentWeightSum > 0 ? weightedSum / presentWeightSum : 0;
  const clampedScore = Math.min(1.0, Math.max(0, score));

  // Scale by source predictive power (OIE Spec & Source Hierarchy Validation)
  const predictivePower = features.f_proc_source_predictive_power.present
    ? features.f_proc_source_predictive_power.value
    : 1.0;
  const finalScore = clampedScore * predictivePower;

  contributing.push(`Source predictive power scaling: ${(predictivePower * 100).toFixed(0)}%`);

  const reason = buildProcReason(finalScore, contributing);

  return {
    score: finalScore,
    reason,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}

function buildProcReason(score: number, evidence: string[]): string {
  if (score >= 0.75) return `High procurement likelihood — strong evidence: ${evidence.slice(0, 2).join('; ')}`;
  if (score >= 0.50) return `Moderate procurement likelihood — some signals present`;
  if (score >= 0.25) return `Low-moderate procurement likelihood — limited evidence`;
  return `Weak procurement signal — insufficient evidence to assess`;
}
