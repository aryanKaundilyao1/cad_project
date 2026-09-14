/**
 * RISK — Risk Score
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.10):
 *   Probability the opportunity is low-quality, fraudulent, stale,
 *   or a wasted-effort trap.
 *
 * Formula:
 *   Rule-based flags — each flag independently contributes to risk.
 *   A conjunctive model similar to QUAL (each flag is sufficient to raise risk).
 *   Risk is ADDITIVE: more flags = higher risk.
 *
 * Risk score [0,1]:
 *   0.00 = no flags raised
 *   0.25 per moderate flag
 *   0.50 per severe flag
 *   Capped at 1.0
 *
 * A risk_score > RISK_CONFIG.suppression_threshold suppresses the lead from ranking
 * (stored but not surfaced in outreach).
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { MetricResult } from '../types';
import { RISK_CONFIG } from '../config/scoring.config';

interface RiskFlag {
  name: string;
  severity: 'severe' | 'moderate' | 'minor';
  message: string;
}

export function scoreRISK(features: FeatureSet): MetricResult {
  const flags: RiskFlag[] = [];
  const contributing: string[] = [];
  const missing: string[] = [];

  // ── Flag 1: Company legal status ───────────────────────────────────────────
  if (features.f_risk_legal_status.present) {
    const status = features.f_risk_legal_status.value.toLowerCase();
    if (status === 'struck_off' || status === 'struck off') {
      flags.push({ name: 'legal_status', severity: 'severe', message: 'Company is struck off (MCA data)' });
    } else if (status === 'dormant') {
      flags.push({ name: 'legal_status', severity: 'moderate', message: 'Company is dormant' });
    } else if (status === 'active') {
      contributing.push('Company legal status: Active');
    } else {
      contributing.push(`Company legal status: ${status} (unrecognised — caution)`);
      flags.push({ name: 'legal_status', severity: 'minor', message: `Unrecognised legal status: ${status}` });
    }
  } else {
    missing.push('company_legal_status (MCA data unavailable — risk not evaluated on this dimension)');
  }

  // ── Flag 2: Duplicate record ───────────────────────────────────────────────
  if (features.f_risk_duplicate_flag.present) {
    if (features.f_risk_duplicate_flag.value) {
      flags.push({ name: 'duplicate', severity: 'moderate', message: 'Duplicate record detected' });
    } else {
      contributing.push('No duplicate detected');
    }
  } else {
    missing.push('duplicate_record_flag (deduplication not run for this record)');
  }

  // ── Flag 3: Internal complaints ────────────────────────────────────────────
  if (features.f_risk_complaint_count.present) {
    const count = features.f_risk_complaint_count.value;
    if (count > RISK_CONFIG.complaint_count_threshold) {
      flags.push({
        name: 'complaints',
        severity: count >= 3 ? 'severe' : 'moderate',
        message: `${count} internal complaint(s) on record`,
      });
    } else {
      contributing.push(`Internal complaint count: ${count} (within threshold)`);
    }
  } else {
    missing.push('internal_complaint_count (CRM history unavailable)');
  }

  // ── Flag 4: Tender cancellation history ────────────────────────────────────
  if (features.f_risk_tender_cancellation.present) {
    if (features.f_risk_tender_cancellation.value) {
      flags.push({ name: 'tender_cancellation', severity: 'moderate', message: 'Tender cancellation history detected' });
    } else {
      contributing.push('No tender cancellation history');
    }
  } else {
    missing.push('tender_cancellation_history_flag');
  }

  // ── Flag 5: Source spam rate ────────────────────────────────────────────────
  if (features.f_risk_source_spam_rate.present) {
    const rate = features.f_risk_source_spam_rate.value;
    if (rate > RISK_CONFIG.spam_rate_threshold) {
      flags.push({
        name: 'source_spam',
        severity: rate > 0.60 ? 'severe' : 'moderate',
        message: `Source spam rate ${(rate * 100).toFixed(0)}% exceeds threshold`,
      });
    } else {
      contributing.push(`Source spam rate: ${(rate * 100).toFixed(0)}% (acceptable)`);
    }
  } else {
    // Derive spam risk from source tier's false-positive risk
    // This is implicit — the source tier already encodes noise level
    missing.push('source_spam_rate (using source-tier false-positive risk as proxy)');
  }

  // ── Flag 6: Data staleness ─────────────────────────────────────────────────
  if (features.f_risk_data_freshness_days.present) {
    const days = features.f_risk_data_freshness_days.value;
    if (days > RISK_CONFIG.max_acceptable_freshness_days) {
      flags.push({
        name: 'stale_data',
        severity: days > 365 ? 'severe' : 'moderate',
        message: `Data is ${days} days old (threshold: ${RISK_CONFIG.max_acceptable_freshness_days} days)`,
      });
    } else {
      contributing.push(`Data freshness: ${days} days (within acceptable range)`);
    }
  } else {
    missing.push('data_freshness_days / evidence_capture_date');
  }

  // ── Flag 7: Website unavailable ────────────────────────────────────────────
  if (features.f_risk_website_dead.present) {
    if (features.f_risk_website_dead.value) {
      flags.push({ name: 'website_dead', severity: 'moderate', message: 'Website is dead/unavailable' });
    }
  }

  // ── Flag 8: Project cancelled / completed ──────────────────────────────────
  if (features.f_risk_project_cancelled.present && features.f_risk_project_cancelled.value) {
    flags.push({ name: 'project_cancelled', severity: 'severe', message: 'Project has been cancelled' });
  } else if (features.f_risk_project_completed.present && features.f_risk_project_completed.value) {
    flags.push({ name: 'project_completed', severity: 'moderate', message: 'Project is already completed' });
  }

  // ── Compute risk score ─────────────────────────────────────────────────────
  let riskSum = 0;
  for (const flag of flags) {
    if (flag.severity === 'severe') riskSum += 0.50;
    else if (flag.severity === 'moderate') riskSum += 0.25;
    else riskSum += 0.10;
  }
  const score = Math.min(1.0, riskSum);

  // Collect flag messages as contributing evidence (they ARE the evidence for risk)
  const flagMessages = flags.map(f => `⚠ ${f.message}`);

  const reason = buildRiskReason(score, flags);

  return {
    score,
    reason,
    contributing_evidence: [...contributing, ...flagMessages],
    missing_evidence: missing,
  };
}

function buildRiskReason(score: number, flags: RiskFlag[]): string {
  if (flags.length === 0) return 'Low risk — no flags raised';
  const severeCount = flags.filter(f => f.severity === 'severe').length;
  if (severeCount > 0) return `High risk — ${severeCount} severe flag(s): ${flags.filter(f => f.severity === 'severe').map(f => f.name).join(', ')}`;
  if (score >= 0.50) return `Elevated risk — ${flags.length} flag(s) raised`;
  return `Moderate risk — ${flags.length} flag(s): ${flags.map(f => f.name).join(', ')}`;
}
