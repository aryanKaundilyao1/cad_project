/**
 * OIE Source Weightage Verification Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * This script runs the pipeline on the diversified_sources_leads.json dataset
 * and outputs a detailed table mapping the exact parameters of each source tier
 * (reliability, significance, predictive power, false-positive risk)
 * to demonstrate how they influence the final Lead Score.
 *
 * Usage:
 *   npm run pipeline-test-source-weightage
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { scoreBatch } from './pipeline.js';
import { SOURCE_HIERARCHY } from './config/sourceHierarchy.js';
import type { RawLeadRecord, LeadScoreResult } from './types.js';

// ANSI styling colors
const B = '\x1b[1m', D = '\x1b[2m', R = '\x1b[0m';
const G = '\x1b[32m', Y = '\x1b[33m', RE = '\x1b[31m', C = '\x1b[36m', M = '\x1b[35m';

function colorScore(s: number | null): string {
  if (s === null) return D + 'N/A' + R;
  if (s >= 50) return G + s.toString().padStart(3) + R;
  if (s >= 20) return Y + s.toString().padStart(3) + R;
  return RE + s.toString().padStart(3) + R;
}

function colorValue(v: number): string {
  if (v >= 0.75) return G + v.toFixed(2) + R;
  if (v >= 0.40) return Y + v.toFixed(2) + R;
  return D + v.toFixed(2) + R;
}

async function main() {
  console.log('\n' + '═'.repeat(105));
  console.log(`  ${B}${C}OIE SOURCE HIERARCHY VALIDATION RUNNER${R}`);
  console.log(`  ${D}Goal: Demonstrate how evidence source parameters directly control OIE Lead Scores${R}`);
  console.log('═'.repeat(105));

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const jsonPath = join(__dirname, 'data', 'diversified_sources_leads.json');

  let leads: RawLeadRecord[];
  try {
    leads = JSON.parse(readFileSync(jsonPath, 'utf-8')) as RawLeadRecord[];
    console.log(`\n  ✓ Loaded ${leads.length} leads representing all 12 source tiers.\n`);
  } catch (err) {
    console.error(`  ✗ Failed to load: ${jsonPath}`, err);
    process.exit(1);
  }

  // Run the OIE scoring pipeline
  const { results } = scoreBatch(leads);

  console.log(`${B}Source Tier Weights Table (from SOURCE_HIERARCHY):${R}`);
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}`);
  console.log(`  ${B}${'Source Tier (Key)'.padEnd(30)} | Reliability | Predictive | Significance | FP Risk | Half-Life${R}`);
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}`);
  
  for (const [key, tier] of Object.entries(SOURCE_HIERARCHY)) {
    console.log(
      `  ${key.padEnd(30)} | ` +
      `${tier.reliability.toFixed(2).padStart(11)} | ` +
      `${tier.predictivePower.toFixed(2).padStart(10)} | ` +
      `${tier.significance.toFixed(2).padStart(12)} | ` +
      `${tier.falsePositiveRisk.toFixed(2).padStart(7)} | ` +
      `${tier.freshnessHalfLifeDays.toString().padStart(5)} days`
    );
  }
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}\n`);

  console.log(`${B}Pipeline Execution & Scores Breakdown (Sorted by Rank/Lead Score DESC):${R}`);
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}`);
  console.log(`  ${B}Rank | Lead Score | Company Name                    | Source Key          | PROC  | CONT  | CONF  | FIT${R}`);
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}`);

  results.forEach((r, idx) => {
    const rankStr = (idx + 1).toString().padStart(4);
    const scoreStr = colorScore(r.lead_score);
    const compName = r.company_name.substring(0, 31).padEnd(31);
    const srcKey = r.source_key.substring(0, 19).padEnd(19);
    
    const procStr = r.proc_score !== null ? colorValue(r.proc_score) : D + ' -  ' + R;
    const contStr = r.cont_score !== null ? colorValue(r.cont_score) : D + ' -  ' + R;
    const confStr = r.conf_score !== null ? colorValue(r.conf_score) : D + ' -  ' + R;
    const fitStr = r.fit_score !== null ? colorValue(r.fit_score) : D + ' -  ' + R;

    const suppressed = r.risk_suppressed ? RE + ' [SUPP]' + R : '';
    const disq = !r.qualification_passed ? RE + ' [DISQ]' + R : '';

    console.log(`  ${rankStr} | ${scoreStr.padStart(10)}  | ${compName} | ${srcKey} |  ${procStr} |  ${contStr} |  ${confStr} |  ${fitStr}${suppressed}${disq}`);
  });
  console.log(`${D}─────────────────────────────────────────────────────────────────────────────────────────────────────────${R}\n`);

  console.log(`${B}Core Validation Insights:${R}`);
  console.log(`  1. ${B}PROC scaling via Predictive Power:${R} Look at 'TenderCorp' vs 'Universal Spares' (Google Maps).`);
  console.log(`     TenderCorp has rich procurement evidence and is multiplied by Tender tier's high Predictive Power (${SOURCE_HIERARCHY.government_tender.predictivePower.toFixed(2)}).`);
  console.log(`     Universal Spares (Google Maps) has its procurement score scaled by ${SOURCE_HIERARCHY.google_maps.predictivePower.toFixed(2)}, leading to a low PROC value (${results.find(r => r.source_key === 'google_maps')?.proc_score?.toFixed(2) ?? '0.00'}) despite having standard variables.`);
  console.log(`  2. ${B}CONF noisy-OR scaling via Source Reliability:${R}`);
  console.log(`     Manual Research (Premium Quality Casting) reaches high CONF (${results.find(r => r.source_key === 'manual_research')?.conf_score?.toFixed(2) ?? '0.00'}) because of its high base reliability (${SOURCE_HIERARCHY.manual_research.reliability.toFixed(2)}).`);
  console.log(`     Generic Directory listings have low CONF due to a low base reliability (${SOURCE_HIERARCHY.business_directory.reliability.toFixed(2)}).`);
  console.log(`  3. ${B}Qualification Gates:${R} Non-matching industries or sizes fail QUAL and do not get ranked for Outreach.`);
  console.log('');
}

main().catch(err => {
  console.error('Validation test failed:', err);
  process.exit(1);
});
