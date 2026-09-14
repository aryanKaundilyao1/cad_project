/**
 * OIE Pipeline Test — Ayurvedic Medicine Export to Europe
 * ─────────────────────────────────────────────────────────────────────────────
 * Scenario: JAS client exports Ayurvedic medicines / herbal supplements to
 * European importers, distributors, and wellness retailers.
 *
 * TWO SCORES ARE SHOWN PER LEAD:
 *
 *   1. OIE Lead Score [0–100]  — geometric mean of PROC × CONT × CONF × FIT
 *      This is the "actionability score". A lead with NO contact info scores 0
 *      because you literally cannot reach them — this is intentional.
 *
 *   2. Weighted Average (WA) Score [0–100] — additive weighted sum
 *      PROC×25 + CONT×20 + CONF×20 + FIT×15 + OPP×15 + (1−RISK)×5
 *      This is the "opportunity attractiveness score" regardless of contact.
 *      Use this to prioritise WHO to find contact for when CONT is missing.
 *
 * WHY OIE SCORES ARE LOW:
 *   • Geometric mean penalises zeros severely (0 × anything = 0).
 *   • CONT=0 (no verified contact) collapses the OIE score — by design.
 *   • Google Maps / Outscraper sources have low PROC (no tender signals).
 *   • WA score reflects true opportunity strength even without contact.
 *
 * Usage:  npm run pipeline-test-ayurveda
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { normalizeEvidence } from './evidenceNormalizer.js';
import { extractFeatures } from './featureExtractor.js';
import { scorePROC } from './metrics/proc.js';
import { scoreCONT } from './metrics/cont.js';
import { scoreCONF } from './metrics/conf.js';
import { scoreFIT } from './metrics/fit.js';
import { scoreRISK } from './metrics/risk.js';
import { scoreOPP } from './metrics/opp.js';
import { aggregate } from './aggregation.js';
import type { RawLeadRecord, LeadScoreResult } from './types.js';

// ─── Ayurveda Export ICP ──────────────────────────────────────────────────────

const AYURVEDA_CLIENT_CAPABILITY_TAGS = [
  'ashwagandha', 'triphala', 'neem', 'brahmi', 'chyawanprash', 'turmeric',
  'ayurvedic', 'ayurveda', 'herbal supplement', 'herbal extract', 'organic supplement',
  'nutraceutical', 'botanical', 'organic powder', 'ayurvedic capsules',
  'organic oils', 'herbal medicine', 'wellness', 'traditional medicine',
  'herbal remedies', 'organic health', 'phytotherapy', 'ashwagandha extract',
  'brahmi powder', 'triphala churna', 'ayurvedic herbs bulk', 'ayurvedic medicine',
  'ayush certified', 'herbal extracts', 'organic supplements',
];

const AYURVEDA_ICP = {
  qualifying_industries: [
    'pharmaceutical', 'wellness', 'herbal', 'nutraceutical', 'import_distribution',
    'retail_health', 'health_food', 'ayurvedic', 'natural_health',
  ],
  qualifying_geographies: [
    'germany', 'france', 'uk', 'netherlands', 'spain', 'italy',
    'poland', 'austria', 'belgium', 'sweden', 'denmark', 'norway',
    'switzerland', 'europe', 'bavaria', 'south_holland', 'catalonia',
    'lombardy', 'masovian', 'vienna', 'antwerp', 'stockholm', 'england',
    'île-de-france',
  ],
  minimum_size_band: 'small' as const,
};

// WA display weights
const WA = { PROC: 0.25, CONT: 0.20, CONF: 0.20, FIT: 0.15, OPP: 0.15, RISK: 0.05 };

// ─── Custom QUAL for Ayurveda ICP ─────────────────────────────────────────────

function qualAyurveda(features: any): any {
  const contrib: string[] = [];
  const missing: string[] = [];
  const SIZE_ORDER = ['micro', 'small', 'medium', 'large', 'enterprise'];

  function norm(s: string) { return s.toLowerCase().replace(/[\s\-_\/]+/g, '_'); }
  function matchesAny(value: string, list: string[]): boolean {
    if (!list.length) return true;
    const nv = norm(value);
    return list.some(i => { const ni = norm(i); return ni === nv || nv.includes(ni) || ni.includes(nv); });
  }

  if (features.f_qual_industry_code.present) {
    const v = features.f_qual_industry_code.value;
    if (!matchesAny(v, AYURVEDA_ICP.qualifying_industries))
      return { passed: false, score: 0, reason: `Industry "${v}" outside Ayurveda ICP`, failed_gate: 'industry', contributing_evidence: [], missing_evidence: missing };
    contrib.push(`Industry: "${v}" ✓`);
  } else { missing.push('industry_code absent'); }

  if (features.f_qual_geography.present) {
    const v = features.f_qual_geography.value;
    if (!matchesAny(v, AYURVEDA_ICP.qualifying_geographies))
      return { passed: false, score: 0, reason: `Geography "${v}" not in Europe ICP`, failed_gate: 'geography', contributing_evidence: contrib, missing_evidence: missing };
    contrib.push(`Geography: "${v}" ✓`);
  } else { missing.push('geography absent'); }

  if (features.f_qual_size_band.present) {
    const v = features.f_qual_size_band.value;
    if (SIZE_ORDER.indexOf(v) < SIZE_ORDER.indexOf(AYURVEDA_ICP.minimum_size_band))
      return { passed: false, score: 0, reason: `Size "${v}" below ICP minimum`, failed_gate: 'size', contributing_evidence: contrib, missing_evidence: missing };
    contrib.push(`Size: "${v}" ✓`);
  } else { missing.push('size absent'); }

  return { passed: true, score: 1, reason: `Qualified — ${contrib.join('; ')}`, contributing_evidence: contrib, missing_evidence: missing };
}

// ─── Extended result type ─────────────────────────────────────────────────────

interface AyurResult extends LeadScoreResult {
  wa_score: number;                  // weighted average [0–100]
  wa_breakdown: Record<string, { weight: number; score: number; contrib: number }>;
  data_profile: string;             // 'rich' | 'partial' | 'contact-only' | 'no-contact' | 'sparse'
}

// ─── Scorer ──────────────────────────────────────────────────────────────────

let counter = 1;
function scoreLeadAyurveda(raw: RawLeadRecord): AyurResult {
  const lead_id = raw.id ?? `ayu-${String(counter++).padStart(3, '0')}`;
  const company_name = raw.company_name ?? 'Unknown';

  const evidence = normalizeEvidence(raw);
  const features = extractFeatures(evidence);
  const qual = qualAyurveda(features);

  if (!qual.passed) {
    const r = aggregate({ lead_id, company_name, source: raw.source, source_key: evidence.source_key, qual, proc: null, cont: null, conf: null, fit: null, risk: null, opp: null });
    return { ...r, wa_score: 0, wa_breakdown: {}, data_profile: 'disqualified' };
  }

  const proc = scorePROC(features);
  const cont = scoreCONT(features);
  const conf = scoreCONF(features);
  const fit  = scoreFIT(features, AYURVEDA_CLIENT_CAPABILITY_TAGS);
  const risk = scoreRISK(features);
  const opp  = scoreOPP(features, proc.score);

  const result = aggregate({ lead_id, company_name, source: raw.source, source_key: evidence.source_key, qual, proc, cont, conf, fit, risk, opp });

  // Weighted average
  const fitScore = (fit.score !== null && fit.score !== undefined) ? (fit.score as number) : 1.0;
  const wa_breakdown: Record<string, { weight: number; score: number; contrib: number }> = {
    PROC: { weight: WA.PROC, score: proc.score,         contrib: WA.PROC * proc.score },
    CONT: { weight: WA.CONT, score: cont.score,         contrib: WA.CONT * cont.score },
    CONF: { weight: WA.CONF, score: conf.score,         contrib: WA.CONF * conf.score },
    FIT:  { weight: WA.FIT,  score: fitScore,           contrib: WA.FIT  * fitScore   },
    OPP:  { weight: WA.OPP,  score: opp.score,          contrib: WA.OPP  * opp.score  },
    RISK: { weight: WA.RISK, score: 1 - (risk.score ?? 0), contrib: WA.RISK * (1 - (risk.score ?? 0)) },
  };
  const wa_score = Math.round(Object.values(wa_breakdown).reduce((a, b) => a + b.contrib, 0) * 100);

  // Data profile label
  const hasProc = (raw.tender_count_trailing_12mo ?? 0) > 0 || raw.tender_value_if_known != null;
  const hasCont = (cont.score ?? 0) > 0.3;
  const hasVerifiedCont = (cont.score ?? 0) >= 0.6;
  const hasBudget = raw.budget_band_estimate != null || raw.tender_value_if_known != null;
  const noContact = !raw.email && !raw.phone;

  let data_profile: string;
  if (hasProc && hasBudget && hasVerifiedCont) data_profile = 'rich';
  else if (hasProc && hasCont) data_profile = 'partial';
  else if (noContact && (raw.google_rating || raw.website)) data_profile = 'reviews-only';
  else if (noContact) data_profile = 'no-contact';
  else data_profile = 'sparse';

  return { ...result, wa_score, wa_breakdown, data_profile };
}

// ─── ANSI colours ─────────────────────────────────────────────────────────────

const B = '\x1b[1m', D = '\x1b[2m', R = '\x1b[0m';
const G = '\x1b[32m', Y = '\x1b[33m', RE = '\x1b[31m', C = '\x1b[36m', M = '\x1b[35m', BL = '\x1b[34m';

function sc(v: number) { return v >= 55 ? G : v >= 30 ? Y : RE; }

function hbar(v: number | null, w = 20, col = ''): string {
  if (v === null) return D + '[' + '─'.repeat(w) + '] N/A' + R;
  const f = Math.round(Math.max(0, Math.min(1, v)) * w);
  const c = col || sc(Math.round(v * 100));
  return c + '[' + '▓'.repeat(f) + '░'.repeat(w - f) + `] ${(v * 100).toFixed(0).padStart(3)}%` + R;
}

function leadBar(score: number, w = 40): string {
  const f = Math.round((score / 100) * w);
  return sc(score) + '[' + '█'.repeat(f) + '░'.repeat(w - f) + `] ${score}` + R;
}

function profileBadge(p: string): string {
  switch (p) {
    case 'rich':         return G + '● RICH DATA' + R;
    case 'partial':      return Y + '◑ PARTIAL'   + R;
    case 'reviews-only': return D + '★ REVIEWS ONLY' + R;
    case 'no-contact':   return RE + '✗ NO CONTACT' + R;
    case 'sparse':       return D + '○ SPARSE'    + R;
    default:             return D + p.toUpperCase() + R;
  }
}

function sourceIcon(key: string): string {
  const icons: Record<string, string> = {
    government_tender: '🏛',
    rfq_private:       '📄',
    import_export:     '📦',
    google_maps:       '📍',
    business_directory:'📒',
    manual_research:   '🔬',
    general_news:      '📰',
    unknown:           '❓',
  };
  return icons[key] ?? '•';
}

// ─── Contact strategy ─────────────────────────────────────────────────────────

function strategy(r: AyurResult): { label: string; detail: string } {
  if (!r.qualification_passed) return { label: '⛔ SKIP', detail: 'Not qualified for Ayurveda ICP' };
  if (r.risk_suppressed)       return { label: '⛔ SKIP', detail: 'High risk — do not contact' };

  const oie  = r.lead_score ?? 0;
  const wa   = r.wa_score;
  const cont = r.cont_score ?? 0;

  if (oie >= 50 && cont >= 0.6) return { label: '🔥 PRIORITY 1 — CALL NOW',         detail: 'Verified decision-maker + strong procurement signal. Call + send catalog today.' };
  if (oie >= 30 && cont >= 0.5) return { label: '📧 PRIORITY 2 — EMAIL TODAY',       detail: 'Good signals, contactable. Send personalised intro + pricing sheet in 24hrs.' };
  if (oie >= 15 && cont >= 0.3) return { label: '📩 PRIORITY 3 — EMAIL THIS WEEK',   detail: 'Moderate signals. Email intro + schedule a call.' };
  if (wa  >= 55 && cont < 0.2)  return { label: '🔍 FIND CONTACT — HIGH VALUE',      detail: 'Strong opportunity but no contact. Research LinkedIn / company site urgently.' };
  if (wa  >= 40 && cont < 0.2)  return { label: '🔍 FIND CONTACT — MEDIUM VALUE',    detail: 'Worth finding contact. Check company website, LinkedIn, local directory.' };
  if (oie >= 5  && cont >= 0.3) return { label: '📬 PRIORITY 4 — NURTURE',           detail: 'Low signals but reachable. Add to email nurture sequence.' };
  return { label: '💬 LOW — NURTURE LIST',                                            detail: 'Insufficient signals or no contact. Monitor for new data.' };
}

// ─── Per-lead print ───────────────────────────────────────────────────────────

function printLead(r: AyurResult, rank: number) {
  const SEP = '─'.repeat(78);
  const oie = r.lead_score ?? 0;
  const wa  = r.wa_score;
  const s   = strategy(r);

  console.log(`\n${SEP}`);
  console.log(`  ${B}#${rank}  ${r.company_name}${R}  ${profileBadge(r.data_profile)}  ${sourceIcon(r.source_key)} ${D}${r.source}${R}`);
  console.log(`  ${D}${(r as any)._source_note ?? r.source}${R}`);
  console.log(SEP);

  if (!r.qualification_passed) {
    console.log(`  ${RE}❌ NOT QUALIFIED: ${r.qual_result.reason}${R}`);
    return;
  }

  // Sub-score grid
  console.log(`\n  ${B}Sub-Scores (Individual):${R}`);
  console.log(`  ${'Metric'.padEnd(6)}  Score                      Why`);
  console.log(`  ${'──────'.padEnd(6)}  ${'──────────────────────────'.padEnd(26)} ${'──────────────────────────────────────────'}`);

  const sb = r.score_breakdown;
  const rows = [
    ['PROC', r.proc_score,  sb.proc?.reason  ?? ''],
    ['CONT', r.cont_score,  sb.cont?.reason  ?? ''],
    ['CONF', r.conf_score,  sb.conf?.reason  ?? ''],
    ['FIT',  r.fit_score,   sb.fit?.reason   ?? ''],
    ['RISK', r.risk_score,  sb.risk?.reason  ?? ''],
    ['OPP',  r.opp_score,   `${r.opp_bucket ?? '-'} — ${sb.opp?.reason?.slice(0, 45) ?? ''}`],
  ] as [string, number | null, string][];

  for (const [label, score, reason] of rows) {
    const col = label === 'RISK'
      ? ((score ?? 0) >= 0.5 ? RE : (score ?? 0) >= 0.25 ? Y : G)
      : sc(Math.round((score ?? 0) * 100));
    const bar = score !== null
      ? col + '[' + '▓'.repeat(Math.round((score ?? 0) * 20)) + '░'.repeat(20 - Math.round((score ?? 0) * 20)) + `] ${((score ?? 0) * 100).toFixed(0).padStart(3)}%` + R
      : D + '[────────────────────] N/A' + R;
    console.log(`  ${label.padEnd(6)}  ${bar}   ${D}${reason.slice(0, 50)}${R}`);
  }

  // WA contribution table
  console.log(`\n  ${B}Weighted Average Breakdown:${R}`);
  console.log(`  ${'Metric'.padEnd(6)}  ${'Wt'.padEnd(5)}  ${'Score'.padEnd(7)}  Contribution   Mini-bar`);
  console.log(`  ${'──────'.padEnd(6)}  ${'──'.padEnd(5)}  ${'─────'.padEnd(7)}  ─────────────  ────────────────────`);

  let waTotal = 0;
  for (const [key, d] of Object.entries(r.wa_breakdown)) {
    const label = key === 'RISK' ? 'RISK*' : key;
    const contrib = d.contrib * 100;
    waTotal += contrib;
    const miniLen = Math.round(d.contrib * 100);
    const mini = '█'.repeat(Math.min(20, miniLen)) + '░'.repeat(Math.max(0, 20 - miniLen));
    console.log(`  ${label.padEnd(6)}  ${(d.weight * 100).toFixed(0).padStart(4)}%  ${(d.score * 100).toFixed(0).padStart(5)}%   +${contrib.toFixed(1).padStart(5)}%        ${D}${mini}${R}`);
  }
  console.log(`  ${'──────'.padEnd(6)}  ${'──'.padEnd(5)}  ${'─────'.padEnd(7)}  ─────────────  ────────────────────`);
  console.log(`  ${'TOTAL'.padEnd(6)}  100%           ${B}${sc(wa)} ${waTotal.toFixed(1)}%${R}  →  WA Score: ${sc(wa)}${B}${wa}/100${R}  ${D}(* RISK inverted: 1-score)${R}`);

  // Dual score display
  console.log(`\n  ${B}OIE Lead Score${R}  (geometric mean × FIT — actionability):   ${leadBar(oie, 36)}`);
  console.log(`  ${B}WA Score      ${R}  (weighted average  — opportunity value):   ${leadBar(wa,  36)}`);

  // Contact recommendation
  console.log(`\n  ${B}Contact Strategy:${R} ${s.label}`);
  console.log(`  ${D}  → ${s.detail}${R}`);

  // Key missing evidence
  const allMissing: string[] = [];
  for (const m of Object.values(r.score_breakdown)) {
    if (m?.missing_evidence) allMissing.push(...m.missing_evidence);
  }
  const unique = Array.from(new Set(allMissing));
  if (unique.length > 0) {
    console.log(`\n  ${D}Missing evidence: ${unique.slice(0, 3).join(' · ')}${unique.length > 3 ? ` · +${unique.length - 3} more` : ''}${R}`);
  }
}

// ─── Priority summary ─────────────────────────────────────────────────────────

function printPriority(sorted: AyurResult[]) {
  console.log('\n' + '═'.repeat(78));
  console.log(`  ${B}${M}▶  PRIORITY CONTACT PLAN — AYURVEDIC MEDICINE EXPORT TO EUROPE${R}`);
  console.log('═'.repeat(78));

  console.log(`\n  ${B}${'Pri'.padEnd(4)}  ${'OIE'.padEnd(5)}  ${'WA%'.padEnd(5)}  ${'OPP'.padEnd(7)}  ${'Data'.padEnd(13)}  ${'Source'.padEnd(19)}  Company${R}`);
  console.log(`  ${'─'.repeat(4)}  ${'─'.repeat(5)}  ${'─'.repeat(5)}  ${'─'.repeat(7)}  ${'─'.repeat(13)}  ${'─'.repeat(19)}  ${'─'.repeat(28)}`);

  let rank = 1;
  const notQual: AyurResult[] = [];

  for (const r of sorted) {
    if (!r.qualification_passed) { notQual.push(r); continue; }
    const oie = r.lead_score ?? 0;
    const wa  = r.wa_score;
    const opp = (r.opp_bucket ?? '─').padEnd(7);
    const src = r.source.substring(0, 18).padEnd(18);
    const name = (r.company_name ?? '?').substring(0, 27);
    const prof = r.data_profile.substring(0, 12).padEnd(12);
    const supp = r.risk_suppressed ? RE + ' ⛔SUPP' + R : '';

    console.log(`  ${String(rank).padStart(3)}.  ${sc(oie)}${String(oie).padStart(4)}${R}  ${sc(wa)}${String(wa).padStart(4)}%${R}  ${opp}  ${prof}  ${src}   ${name}${supp}`);

    const s = strategy(r);
    console.log(`  ${D}       ↳ ${s.label}: ${s.detail.slice(0, 70)}${R}`);
    rank++;
  }

  if (notQual.length) {
    console.log(`\n  ${RE}Not Qualified:${R}`);
    for (const r of notQual)
      console.log(`    ${RE}✗${R} ${r.company_name} — ${r.qual_result.reason}`);
  }
}

// ─── Explanation of score gap ─────────────────────────────────────────────────

function printScoreExplanation() {
  console.log('\n' + '─'.repeat(78));
  console.log(`  ${B}WHY OIE SCORES ARE LOWER THAN WA SCORES${R}`);
  console.log('─'.repeat(78));
  console.log(`
  OIE Lead Score = round( GeometricMean(PROC, CONT, CONF) × FIT × 100 )

  Geometric mean properties:
    • ANY single zero → entire score = 0  (intentional per spec)
    • CONT = 0  means "no verified contact" → you CANNOT call/email them
      → OIE correctly shows these as unactionable (score 0)
    • Low PROC + low FIT together multiply → result much lower than their avg

  Weighted Average Score = PROC×25 + CONT×20 + CONF×20 + FIT×15 + OPP×15 + RISK×5

    • Additive — a zero on one metric is partially offset by others
    • Reflects opportunity ATTRACTIVENESS even when contact is missing
    • Use WA to decide WHERE to spend time finding contacts

  Rule of thumb:
    High WA + Low OIE  →  High-value lead with no contact → FIND THEIR CONTACT
    High OIE           →  Fully actionable → REACH OUT NOW
    Low both           →  Low priority → nurture or skip
  `);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(78));
  console.log(`  ${B}${C}JAS CONNECT — OIE Scoring Engine v1.0${R}`);
  console.log(`  ${B}${C}Scenario: Ayurvedic Medicine Export → European Buyers${R}`);
  console.log(`  ${D}ICP: Pharmaceutical / Wellness / Herbal · Geography: Europe${R}`);
  console.log('═'.repeat(78));

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const jsonPath  = join(__dirname, 'data', 'ayurveda_europe_leads.json');

  let leads: RawLeadRecord[];
  try {
    leads = JSON.parse(readFileSync(jsonPath, 'utf-8')) as RawLeadRecord[];
    console.log(`\n  ✓ Loaded ${leads.length} leads`);
  } catch (err) {
    console.error(`  ✗ Failed: ${jsonPath}\n`, err);
    process.exit(1);
  }

  console.log('\n  Running OIE pipeline...');
  const results: AyurResult[] = leads.map(scoreLeadAyurveda);

  // Sort: qualified by WA desc (so even 0-OIE high-WA leads show near top)
  const sorted = [...results].sort((a, b) => {
    if (a.qualification_passed !== b.qualification_passed) return a.qualification_passed ? -1 : 1;
    // Within qualified: OIE first, then WA
    const oieDiff = (b.lead_score ?? -1) - (a.lead_score ?? -1);
    if (oieDiff !== 0) return oieDiff;
    return b.wa_score - a.wa_score;
  });

  // Print per-lead detail
  sorted.forEach((r, i) => printLead(r, i + 1));

  // Priority plan
  printPriority(sorted);

  // Score explanation
  printScoreExplanation();

  // Summary
  const qualified = sorted.filter(r => r.qualification_passed);
  const actionable = qualified.filter(r => (r.lead_score ?? 0) >= 5);
  const findContact = qualified.filter(r => (r.lead_score ?? 0) === 0 && r.wa_score >= 40);
  const avgOIE = qualified.length > 0 ? Math.round(qualified.reduce((a, b) => a + (b.lead_score ?? 0), 0) / qualified.length) : 0;
  const avgWA  = qualified.length > 0 ? Math.round(qualified.reduce((a, b) => a + b.wa_score, 0) / qualified.length) : 0;

  console.log('─'.repeat(78));
  console.log(`  ${B}SUMMARY${R}`);
  console.log('─'.replace('', '─'.repeat(78)));
  console.log(`  Total leads:               ${leads.length}`);
  console.log(`  Qualified for Ayurveda ICP:${qualified.length}`);
  console.log(`  Directly actionable (OIE≥5):${actionable.length}  → reach out now`);
  console.log(`  High-value / find contact:  ${findContact.length}  → research contact, then reach out`);
  console.log(`  Avg OIE Score:             ${avgOIE}`);
  console.log(`  Avg WA Score:              ${avgWA}%`);
  console.log(`  Top priority:              ${sorted[0]?.company_name ?? 'N/A'} (OIE: ${sorted[0]?.lead_score ?? 0}, WA: ${sorted[0]?.wa_score ?? 0}%)`);
  console.log('');
  console.log(`  ${G}✅ Pipeline test completed successfully.${R}`);
  console.log('');

  process.exit(0);
}

main().catch(err => { console.error('✗ Pipeline FAILED:', err); process.exit(1); });
