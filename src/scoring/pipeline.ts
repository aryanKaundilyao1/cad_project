/**
 * OIE Pipeline Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Wires together the full scoring pipeline:
 *
 *   RawLeadRecord
 *     → evidenceNormalizer      (resolve source tier, freshness, flags)
 *     → featureExtractor        (tag each field as Present/Absent)
 *     → QUAL gate               (conjunctive ICP filter)
 *     → (if QUAL passes)
 *         → PROC                (procurement likelihood)
 *         → CONT                (contactability)
 *         → CONF                (evidence confidence)
 *         → FIT                 (commercial fit, Jaccard)
 *         → RISK                (risk flags)
 *         → OPP                 (opportunity strength)
 *     → aggregation             (geometric mean → lead_score)
 *     → LeadScoreResult
 *
 * Client capability tags are injected from the ICP config (not from the lead).
 * All modules are called independently — no shared mutable state.
 */

import { normalizeEvidence } from './evidenceNormalizer';
import { extractFeatures } from './featureExtractor';
import { scorePROC } from './metrics/proc';
import { scoreCONT } from './metrics/cont';
import { scoreCONF } from './metrics/conf';
import { scoreFIT } from './metrics/fit';
import { scoreQUAL } from './metrics/qual';
import { scoreRISK } from './metrics/risk';
import { scoreOPP } from './metrics/opp';
import { aggregate, rankLeads } from './aggregation';
import type { RawLeadRecord, LeadScoreResult } from './types';
import { CLIENT_ICP } from './config/scoring.config';
import { SOURCE_HIERARCHY } from './config/sourceHierarchy';

const CLIENT_CAPABILITY_TAGS: string[] = [
  // Default JAS client capabilities — dynamically extending for Ashwagandha / Ayurveda
  'construction', 'peb', 'pre-engineered buildings', 'steel structure',
  'industrial construction', 'warehouse', 'factory', 'epc',
  'infrastructure', 'civil works', 'fit-out', 'procurement',
  // Ayurveda & Ashwagandha Product Fit
  'ashwagandha', 'triphala', 'neem', 'brahmi', 'chyawanprash', 'turmeric',
  'ayurvedic', 'ayurveda', 'herbal supplement', 'herbal extract', 'organic supplement',
  'nutraceutical', 'botanical', 'organic powder', 'ayurvedic capsules',
  'organic oils', 'herbal medicine', 'wellness', 'traditional medicine',
  'herbal remedies', 'organic health', 'phytotherapy', 'ashwagandha extract',
  'brahmi powder', 'triphala churna', 'ayurvedic herbs bulk', 'ayurvedic medicine',
  'ayush certified', 'herbal extracts', 'organic supplements',
  'pharmaceutical', 'wellness', 'herbal', 'nutraceutical', 'import_distribution',
  'retail_health', 'health_food', 'ayurvedic', 'natural_health', 'b2b', 'herb'
];

let leadIdCounter = 1;

/**
 * Score a single raw lead record through the full OIE pipeline.
 * Pure function — no I/O, no database, no side effects.
 */
export function scoreLead(raw: RawLeadRecord): LeadScoreResult {
  const lead_id = raw.id ?? `lead-${String(leadIdCounter++).padStart(4, '0')}`;
  const company_name = raw.company_name ?? 'Unknown Company';

  // ── Step 1: Normalize Evidence ───────────────────────────────────────────
  const evidence = normalizeEvidence(raw);

  // ── Step 2: Extract Features ─────────────────────────────────────────────
  const features = extractFeatures(evidence);

  // Resolve metadata for DB storage and explainability
  const source_used = SOURCE_HIERARCHY[evidence.source_key]?.name ?? raw.source;
  const evidence_used = Object.entries(features)
    .filter(([_, f]: any) => f.present)
    .map(([k]) => k.replace(/^f_/, ''));
  const evidence_capture_date = raw.evidence_capture_date ?? null;

  // ── Step 3: QUAL Gate ────────────────────────────────────────────────────
  const qual = scoreQUAL(features);

  // removed early exit to support T2 and T3 tiering

  // ── Step 4: Compute Metrics (in parallel — no dependencies between them) ─
  const proc = scorePROC(features);
  const cont = scoreCONT(features);
  const conf = scoreCONF(features);
  const fit = scoreFIT(features, CLIENT_CAPABILITY_TAGS);
  const risk = scoreRISK(features);
  const opp = scoreOPP(features, proc.score);

  // ── Step 5: Aggregate ────────────────────────────────────────────────────
  return aggregate({
    lead_id,
    company_name,
    source: raw.source,
    source_key: evidence.source_key,
    qual,
    proc,
    cont,
    conf,
    fit,
    risk,
    opp,
    source_used,
    evidence_used,
    evidence_capture_date,
  });
}

/**
 * Score a batch of raw leads and return ranked results.
 * Unqualified leads appear at the bottom with null lead_score.
 */
export function scoreBatch(leads: RawLeadRecord[]): {
  results: LeadScoreResult[];
  summary: BatchSummary;
} {
  const results = leads.map(scoreLead);
  const ranked = rankLeads(results);
  const summary = buildSummary(ranked);
  return { results: ranked, summary };
}

export interface BatchSummary {
  total: number;
  qualified: number;
  not_qualified: number;
  risk_suppressed: number;
  avg_lead_score: number | null;
  top_source: string | null;
  score_version: string;
}

function buildSummary(results: LeadScoreResult[]): BatchSummary {
  const qualified = results.filter(r => r.qualification_passed);
  const active = qualified.filter(r => !r.risk_suppressed);
  const scores = active.map(r => r.lead_score).filter((s): s is number => s !== null);

  const avg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // Top source = most common source among qualified leads
  const sourceCount: Record<string, number> = {};
  for (const r of qualified) {
    sourceCount[r.source] = (sourceCount[r.source] ?? 0) + 1;
  }
  const topSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total: results.length,
    qualified: qualified.length,
    not_qualified: results.length - qualified.length,
    risk_suppressed: qualified.filter(r => r.risk_suppressed).length,
    avg_lead_score: avg,
    top_source: topSource,
    score_version: results[0]?.score_version ?? 'unknown',
  };
}
