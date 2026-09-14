/**
 * OIE Aggregation
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the two-stage aggregation from OIE Spec Section 5.
 *
 * Stage A — Gating (conjunctive, non-compensatory):
 *   QUAL = 0  →  return early, no further scoring
 *   RISK > suppression_threshold  →  flag risk_suppressed = true (but still score)
 *
 * Stage B — Core score (geometric mean) [EXPERT JUDGMENT]:
 *   OPP_final = GeometricMean(PROC, CONT, CONF)
 *   Ensures a zero on any critical factor suppresses the overall score
 *   rather than being averaged away.
 *
 * Stage C — Lead Score [0–100]:
 *   lead_score = round(OPP_final × FIT_modifier × 100)
 *
 *   FIT is applied as a multiplicative modifier (not inside the geometric mean)
 *   because it is an ICP-configuration-dependent filter, not an evidence-quality
 *   measure. FIT=0 → score → 0 (opportunity cannot be sold by this client).
 *
 * Tie-breaking: by CONF descending.
 *
 * Note on geometric mean with zeros:
 *   If PROC, CONT, or CONF is exactly 0, the geometric mean collapses to 0.
 *   This is intentional — the spec explicitly requires this property.
 *   A score of 0 means "not actionable" not "bad data".
 */

import type { MetricResult, QualResult, OppResult, LeadScoreResult, OppBucket } from './types';
import { AGGREGATION_RISK_SUPPRESSION_THRESHOLD, AGGREGATION_MIN_CONF, SCORE_VERSION } from './config/scoring.config';

interface AggregationInputs {
  lead_id: string;
  company_name: string;
  source: string;
  source_key: string;
  qual: QualResult;
  proc: MetricResult | null;
  cont: MetricResult | null;
  conf: MetricResult | null;
  fit: MetricResult | null;
  risk: MetricResult | null;
  opp: OppResult | null;
  source_used: string;
  evidence_used: string[];
  evidence_capture_date: string | null;
}

/** Geometric mean of an array of values. Returns 0 if any value is 0. */
function geometricMean(values: number[]): number {
  if (values.length === 0) return 0;
  // If any value is 0, result must be 0 (intentional — see spec)
  if (values.some(v => v <= 0)) return 0;
  const logSum = values.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / values.length);
}

export function aggregate(inputs: AggregationInputs): LeadScoreResult {
  const ts = new Date().toISOString();

  const icp_tier = inputs.qual.icp_tier || 'T1';

  // ── Collect sub-scores ─────────────────────────────────────────────────────
  const proc_score = inputs.proc?.score ?? null;
  const cont_score = inputs.cont?.score ?? null;
  const conf_score = inputs.conf?.score ?? null;
  const fit_score = inputs.fit?.score ?? null;
  const risk_score = inputs.risk?.score ?? null;
  const opp_score = inputs.opp?.score ?? null;
  const opp_bucket = inputs.opp?.bucket ?? null;

  // ── Risk suppression flag ──────────────────────────────────────────────────
  const risk_suppressed =
    risk_score !== null && risk_score > AGGREGATION_RISK_SUPPRESSION_THRESHOLD;

  // ── Stage B: Geometric Mean of PROC, CONT, CONF ───────────────────────────
  const coreValues: number[] = [];
  if (proc_score !== null) coreValues.push(proc_score);
  if (cont_score !== null) coreValues.push(cont_score);
  if (conf_score !== null) coreValues.push(conf_score);

  // If CONF is below minimum, we still score but note unreliability
  const confBelowMin = conf_score !== null && conf_score < AGGREGATION_MIN_CONF;

  // Compute OPP_final
  const opp_final = coreValues.length > 0 ? geometricMean(coreValues) : 0;

  // ── Stage C: Apply FIT modifier ────────────────────────────────────────────
  // FIT = null (no tags) → use 1.0 so it doesn't penalise leads without requirement tags
  // FIT = 0 (explicit no-match) → collapses score to 0
  const fit_modifier = fit_score !== null ? fit_score : 1.0;

  const rawLeadScore = opp_final * fit_modifier * 100;
  const lead_score = Math.round(Math.min(100, Math.max(0, rawLeadScore)));

  // ── Explanation bullets ────────────────────────────────────────────────────
  const bullets: string[] = [];

  if (inputs.qual.passed) {
    bullets.push(`✅ QUAL: Passed — ${inputs.qual.reason}`);
  } else {
    bullets.push(`⚠️ QUAL FAILED [${icp_tier}]: ${inputs.qual.reason}`);
  }

  if (inputs.proc) {
    const pct = (proc_score! * 100).toFixed(0);
    bullets.push(`📋 PROC: ${pct}% — ${inputs.proc.reason}`);
  }
  if (inputs.cont) {
    const pct = (cont_score! * 100).toFixed(0);
    bullets.push(`📞 CONT: ${pct}% — ${inputs.cont.reason}`);
  }
  if (inputs.conf) {
    const pct = (conf_score! * 100).toFixed(0);
    bullets.push(`🔍 CONF: ${pct}% — ${inputs.conf.reason}`);
  }
  if (inputs.fit) {
    const pct = (fit_score! * 100).toFixed(0);
    bullets.push(`🎯 FIT: ${pct}% — ${inputs.fit.reason}`);
  }
  if (inputs.risk) {
    const pct = (risk_score! * 100).toFixed(0);
    const riskEmoji = risk_score! >= 0.50 ? '🔴' : risk_score! >= 0.25 ? '🟡' : '🟢';
    bullets.push(`${riskEmoji} RISK: ${pct}% — ${inputs.risk.reason}`);
  }
  if (inputs.opp) {
    bullets.push(`💡 OPP: ${opp_bucket} (${(opp_score! * 100).toFixed(0)}%) — ${inputs.opp.reason}`);
  }
  if (risk_suppressed) {
    bullets.push(`⛔ SUPPRESSED: Risk score ${(risk_score! * 100).toFixed(0)}% exceeds threshold — excluded from ranking`);
  }
  if (confBelowMin) {
    bullets.push(`⚠️  Low confidence evidence — score is stored but treat with caution`);
  }

  // ── Human-readable explanation ─────────────────────────────────────────────
  const keySignals: string[] = [];
  if (proc_score !== null && proc_score >= 0.60) keySignals.push('High Procurement');
  else if (proc_score !== null && proc_score >= 0.30) keySignals.push('Moderate Procurement');

  if (cont_score !== null && cont_score >= 0.60) keySignals.push('Verified Contact');
  else if (cont_score !== null && cont_score < 0.20) keySignals.push('Weak Contact');

  if (conf_score !== null && conf_score >= 0.70) keySignals.push('High Confidence');
  else if (conf_score !== null && conf_score < 0.30) keySignals.push('Low Confidence');

  if (opp_bucket === 'High') keySignals.push('High Opportunity');
  else if (opp_bucket === 'Medium') keySignals.push('Medium Opportunity');

  if (risk_score !== null && risk_score < 0.15) keySignals.push('Low Risk');
  else if (risk_score !== null && risk_score >= 0.50) keySignals.push('High Risk');

  if (inputs.source) keySignals.push(inputs.source);

  const explanation = keySignals.length > 0
    ? keySignals.join(' · ')
    : `Lead Score: ${lead_score}`;

  return {
    lead_id: inputs.lead_id,
    company_name: inputs.company_name,
    source: inputs.source,
    source_key: inputs.source_key as any,
    qualification_passed: inputs.qual.passed,
    qual_result: inputs.qual,
    icp_tier,
    proc_score,
    cont_score,
    conf_score,
    fit_score,
    qual_score: inputs.qual.score,
    risk_score,
    opp_score,
    opp_bucket,
    lead_score,
    risk_suppressed,
    outreach_eligible: !risk_suppressed && inputs.qual.passed, // Only T1 are natively outreach_eligible, T2/T3 are nurtured
    qual_passed: inputs.qual.passed,
    source_used: inputs.source_used,
    evidence_used: inputs.evidence_used,
    evidence_capture_date: inputs.evidence_capture_date,
    score_breakdown: {
      proc: inputs.proc ?? undefined,
      cont: inputs.cont ?? undefined,
      conf: inputs.conf ?? undefined,
      fit: inputs.fit ?? undefined,
      risk: inputs.risk ?? undefined,
      opp: inputs.opp ?? undefined,
    },
    explanation,
    explanation_bullets: bullets,
    score_version: SCORE_VERSION,
    pipeline_timestamp: ts,
  };
}

/** Rank qualified, non-suppressed leads by lead_score descending, with stable tie-breakers */
export function rankLeads(results: LeadScoreResult[]): LeadScoreResult[] {
  return [...results].sort((a, b) => {
    // Suppressed leads always go to the bottom
    if (a.risk_suppressed !== b.risk_suppressed) {
      return a.risk_suppressed ? 1 : -1;
    }
    
    // Tiered priority (T1 > T2 > T3)
    const tierOrder = { T1: 1, T2: 2, T3: 3 };
    const tierA = tierOrder[a.icp_tier ?? 'T3'];
    const tierB = tierOrder[b.icp_tier ?? 'T3'];
    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Sort by lead_score descending within the same tier
    const scoreA = a.lead_score ?? -1;
    const scoreB = b.lead_score ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie-break 1: CONF descending
    const confA = a.conf_score ?? 0;
    const confB = b.conf_score ?? 0;
    if (confB !== confA) return confB - confA;
    // Tie-break 2: most recent evidence capture date first
    const dateA = a.evidence_capture_date ? new Date(a.evidence_capture_date).getTime() : 0;
    const dateB = b.evidence_capture_date ? new Date(b.evidence_capture_date).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    // Tie-break 3: company name ASC (stable alphabetical)
    return a.company_name.localeCompare(b.company_name);
  }).map((result, idx) => ({
    ...result,
    // Embed rank for downstream use
    _rank: idx + 1,
  })) as LeadScoreResult[];
}
