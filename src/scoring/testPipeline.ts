/**
 * OIE Terminal Pipeline Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   npm run pipeline-test
 *   (or: npx tsx src/scoring/testPipeline.ts)
 *
 * What this script does:
 *   1. Loads dummy_leads.csv
 *   2. Parses each row as a RawLeadRecord
 *   3. Runs the full OIE scoring pipeline
 *   4. Prints a detailed report for each lead
 *   5. Prints the ranked lead list
 *   6. Exits 0 on success, 1 on any error
 *
 * No database, no Supabase, no browser required.
 * This is a pure in-memory test of the scoring engine.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scoreBatch } from './pipeline.js';
import type { RawLeadRecord } from './types.js';
import type { LeadScoreResult } from './types.js';

// ─── CSV parser (minimal, no external dep for the test) ───────────────────────

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });
    return row;
  });
}

/** Handle commas inside quoted fields */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Row → RawLeadRecord ──────────────────────────────────────────────────────

function toBool(val: string): boolean | undefined {
  if (val === 'TRUE' || val === 'true' || val === '1') return true;
  if (val === 'FALSE' || val === 'false' || val === '0') return false;
  return undefined;
}

function toNum(val: string): number | undefined {
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function toTags(val: string): string[] | undefined {
  if (!val) return undefined;
  const tags = val.split('|').map(t => t.trim()).filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

function toIds(val: string): string[] | undefined {
  if (!val) return undefined;
  const ids = val.split('|').map(t => t.trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

function rowToLead(row: Record<string, string>): RawLeadRecord {
  return {
    id: row['id'] || undefined,
    company_name: row['company_name'] || undefined,
    source: row['source'] || 'unknown',

    // PROC
    tender_count_trailing_12mo: toNum(row['tender_count_trailing_12mo']),
    last_tender_date: row['last_tender_date'] || undefined,
    avg_tender_value: toNum(row['avg_tender_value']),
    tender_category_tags: toTags(row['tender_category_tags']),
    expansion_announcement_flag: toBool(row['expansion_announcement_flag']),
    expansion_announcement_date: row['expansion_announcement_date'] || undefined,
    procurement_role_hiring_flag: toBool(row['procurement_role_hiring_flag']),
    procurement_role_hiring_date: row['procurement_role_hiring_date'] || undefined,
    import_shipment_count_trailing_12mo: toNum(row['import_shipment_count_trailing_12mo']),
    import_shipment_last_date: row['import_shipment_last_date'] || undefined,

    // CONT
    email: row['email'] || undefined,
    email_verified_flag: toBool(row['email_verified_flag']),
    phone: row['phone'] || undefined,
    phone_verified_flag: toBool(row['phone_verified_flag']),
    decision_maker_title_match_flag: toBool(row['decision_maker_title_match_flag']),
    contact_last_verified_date: row['contact_last_verified_date'] || undefined,
    prior_successful_contact_flag: toBool(row['prior_successful_contact_flag']),

    // CONF
    evidence_capture_date: row['evidence_capture_date'] || undefined,
    corroborating_source_count: toNum(row['corroborating_source_count']),
    corroborating_source_ids: toIds(row['corroborating_source_ids']),
    extraction_method: row['extraction_method'] || undefined,

    // FIT
    opportunity_requirement_tags: toTags(row['opportunity_requirement_tags']),

    // QUAL
    industry_code: row['industry_code'] || undefined,
    industry: row['industry'] || undefined,
    geography: row['geography'] || row['state'] || undefined,
    state: row['state'] || undefined,
    city: row['city'] || undefined,
    company_size_band: (row['company_size_band'] as any) || undefined,
    budget_band_estimate: toNum(row['budget_band_estimate']),

    // RISK
    company_legal_status: row['company_legal_status'] || undefined,
    duplicate_record_flag: toBool(row['duplicate_record_flag']),
    internal_complaint_count: toNum(row['internal_complaint_count']),
    tender_cancellation_history_flag: toBool(row['tender_cancellation_history_flag']),
    source_spam_rate: toNum(row['source_spam_rate']),

    // OPP
    estimated_company_revenue_band: toNum(row['estimated_company_revenue_band']),
    tender_value_if_known: toNum(row['tender_value_if_known']),
    urgency_deadline_date: row['urgency_deadline_date'] || undefined,
  };
}

// ─── Display helpers ───────────────────────────────────────────────────────────

function bar(score: number | null, width = 20): string {
  if (score === null) return '[' + '─'.repeat(width) + '] N/A';
  const filled = Math.round((score / 1.0) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + `] ${(score * 100).toFixed(0).padStart(3)}%`;
}

function scoreBar100(score: number | null, width = 20): string {
  if (score === null) return '[' + '─'.repeat(width) + '] N/A';
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + `] ${score}`;
}

function printLead(result: LeadScoreResult, rank: number) {
  const sep = '─'.repeat(72);
  console.log(`\n${sep}`);
  console.log(`  Rank #${rank}  ${result.company_name}`);
  console.log(`  Source: ${result.source}  (key: ${result.source_key})`);
  console.log(sep);

  if (!result.qualification_passed) {
    console.log(`  ❌ NOT QUALIFIED: ${result.qual_result.reason}`);
    if (result.qual_result.missing_evidence.length > 0) {
      console.log(`     Missing: ${result.qual_result.missing_evidence.join(', ')}`);
    }
    return;
  }

  console.log(`  ✅ QUALIFIED: ${result.qual_result.reason}`);
  console.log('');
  console.log(`  PROC  ${bar(result.proc_score)}`);
  console.log(`  CONT  ${bar(result.cont_score)}`);
  console.log(`  CONF  ${bar(result.conf_score)}`);
  console.log(`  FIT   ${bar(result.fit_score)}`);
  console.log(`  RISK  ${bar(result.risk_score)}  ${result.risk_score !== null && result.risk_score > 0.5 ? '⚠ HIGH RISK' : ''}`);
  console.log(`  OPP   ${bar(result.opp_score)}  (${result.opp_bucket ?? 'N/A'})`);
  console.log('');
  console.log(`  ┌─ Lead Score ─────────────────────────────────────────┐`);
  console.log(`  │  ${scoreBar100(result.lead_score, 30)}  │`);
  console.log(`  └─────────────────────────────────────────────────────┘`);
  if (result.risk_suppressed) {
    console.log(`  ⛔ SUPPRESSED from ranking (high risk)`);
  }
  console.log('');
  console.log(`  Outreach Eligible: ${result.outreach_eligible ? 'Yes (sent to Outreach)' : 'No (Qualification only)'}`);
  console.log(`  Source Used:       ${result.source_used}`);
  console.log(`  Evidence Present:  ${result.evidence_used.join(', ')}`);
  console.log('');
  console.log(`  Explanation: ${result.explanation}`);
  console.log('');
  console.log('  Breakdown:');
  for (const bullet of result.explanation_bullets) {
    console.log(`    ${bullet}`);
  }

  // Print missing evidence summary
  const allMissing: string[] = [];
  for (const m of Object.values(result.score_breakdown)) {
    if (m?.missing_evidence) allMissing.push(...m.missing_evidence);
  }
  if (allMissing.length > 0) {
    console.log('');
    console.log('  Missing Evidence:');
    const unique = Array.from(new Set(allMissing)).slice(0, 6);
    for (const m of unique) console.log(`    • ${m}`);
    if (allMissing.length > 6) console.log(`    • ...and ${allMissing.length - 6} more`);
  }

  console.log(`\n  Score Version: ${result.score_version}  |  Timestamp: ${result.pipeline_timestamp}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(72));
  console.log('  JAS CONNECT — Opportunity Intelligence Engine');
  console.log('  Terminal Pipeline Test');
  console.log('═'.repeat(72));

  // Load JSON test data
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const jsonPath = join(__dirname, 'data', 'dummy_leads.json');

  let leads: RawLeadRecord[];
  try {
    const jsonText = readFileSync(jsonPath, 'utf-8');
    leads = JSON.parse(jsonText) as RawLeadRecord[];
    console.log(`\n  ✓ Loaded: ${jsonPath}`);
    console.log(`  ✓ Parsed ${leads.length} leads`);
  } catch (err) {
    console.error(`\n  ✗ Failed to load test data: ${jsonPath}`);
    console.error(err);
    process.exit(1);
  }

  // Run pipeline
  console.log('\n  Running full OIE scoring pipeline...\n');
  let { results, summary } = scoreBatch(leads);

  // Print each lead
  results.forEach((result, idx) => printLead(result, idx + 1));

  // Print ranked summary
  console.log('\n' + '═'.repeat(72));
  console.log('  RANKED LEAD LIST (Qualified, by Lead Score)');
  console.log('═'.repeat(72));
  console.log('');
  console.log('  Rank  Score  Company                          OPP     Suppressed  Source');
  console.log('  ────  ─────  ───────────────────────────────  ──────  ──────────  ───────────────');

  let rank = 1;
  for (const r of results) {
    if (!r.qualification_passed) continue;
    const scoreStr = (r.lead_score ?? '-').toString().padStart(5);
    const nameStr = (r.company_name ?? '?').substring(0, 31).padEnd(31);
    const oppStr = (r.opp_bucket ?? '-').padEnd(6);
    const suppStr = r.risk_suppressed ? '⛔ Yes   ' : 'No        ';
    const sourceStr = r.source.substring(0, 20);
    console.log(`  ${String(rank).padStart(4)}  ${scoreStr}  ${nameStr}  ${oppStr}  ${suppStr}  ${sourceStr}`);
    rank++;
  }

  const disqualified = results.filter(r => !r.qualification_passed);
  if (disqualified.length > 0) {
    console.log('');
    console.log('  NOT QUALIFIED:');
    for (const r of disqualified) {
      console.log(`    • ${r.company_name} — ${r.qual_result.failed_gate ?? 'failed gate'}: ${r.qual_result.reason.substring(0, 70)}`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(72));
  console.log('  BATCH SUMMARY');
  console.log('─'.repeat(72));
  console.log(`  Total leads:        ${summary.total}`);
  console.log(`  Qualified:          ${summary.qualified}`);
  console.log(`  Not qualified:      ${summary.not_qualified}`);
  console.log(`  Risk suppressed:    ${summary.risk_suppressed}`);
  console.log(`  Avg lead score:     ${summary.avg_lead_score ?? 'N/A'}`);
  console.log(`  Top source:         ${summary.top_source ?? 'N/A'}`);
  console.log(`  Score version:      ${summary.score_version}`);
  console.log('');
  console.log('  ✅ Pipeline test completed successfully.');
  console.log('');

  process.exit(0);
}

main().catch(err => {
  console.error('\n  ✗ Pipeline test FAILED:');
  console.error(err);
  process.exit(1);
});
