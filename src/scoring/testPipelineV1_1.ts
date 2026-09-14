import { scoreBatch } from './pipeline.js';
import type { RawLeadRecord, LeadScoreResult } from './types.js';

// Define 30 synthetic leads testing v1.1 scenarios
const syntheticLeads: RawLeadRecord[] = [
  {
    company_name: 'Lead 1 - Perfect Lead (Fresh Tender, Planning, DM Email)',
    source: 'government_tender',
    project_status: 'planning',
    procurement_stage: 'rfq',
    project_type: 'new_construction',
    last_tender_date: new Date().toISOString(),
    tender_value_if_known: 5000,
    email: 'ceo@example.com',
    email_verified_flag: true,
    email_type: 'named',
    decision_maker_title_match_flag: true,
    phone: '9876543210',
    phone_verified_flag: true,
    linkedin_url: 'https://linkedin.com/company/lead1',
    website: 'https://lead1.com',
    corroborating_source_ids: ['src1', 'src2', 'src3'],
    corroborating_source_count: 3,
    extraction_method: 'manual',
    industry_code: 'construction',
    company_size_band: 'large',
    geography: 'india',
    opportunity_requirement_tags: ['construction', 'peb'],
    certifications: ['iso9001'],
    business_type: 'manufacturer',
  },
  {
    company_name: 'Lead 2 - Binary Lead (Project exists, no contact info)',
    source: 'google_maps',
    last_tender_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 700).toISOString(), // ~2 years ago
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 3 - Completed Project (Should be high risk)',
    source: 'news',
    project_status: 'completed',
    last_tender_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
    industry_code: 'manufacturing',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 4 - Factory Expansion',
    source: 'company_website',
    project_type: 'expansion',
    project_status: 'planning',
    expansion_announcement_flag: true,
    expansion_announcement_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    industry_code: 'manufacturing',
    geography: 'maharashtra',
    company_size_band: 'enterprise',
  },
  {
    company_name: 'Lead 5 - Generic Email Only',
    source: 'business_directory',
    email: 'info@lead5.com',
    email_verified_flag: true,
    email_type: 'generic',
    industry_code: 'logistics',
    geography: 'gujarat',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 6 - Dormant Company',
    source: 'trade_data',
    company_legal_status: 'dormant',
    industry_code: 'construction',
    geography: 'delhi',
    company_size_band: 'micro',
  },
  {
    company_name: 'Lead 7 - Cancelled Tender',
    source: 'government_tender',
    project_status: 'cancelled',
    tender_cancellation_history_flag: true,
    industry_code: 'infrastructure',
    geography: 'rajasthan',
    company_size_band: 'large',
  },
  {
    company_name: 'Lead 8 - Funding Announcement',
    source: 'news',
    funding_announcement_flag: true,
    industry_code: 'industrial',
    geography: 'karnataka',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 9 - High Budget Project',
    source: 'government_tender',
    tender_value_if_known: 15000, // ₹150 Crore
    project_status: 'ongoing',
    procurement_stage: 'tender',
    industry_code: 'infrastructure',
    geography: 'tamil_nadu',
    company_size_band: 'enterprise',
  },
  {
    company_name: 'Lead 10 - Low Budget Project',
    source: 'government_tender',
    tender_value_if_known: 5, // ₹5 Lakhs
    project_status: 'ongoing',
    procurement_stage: 'tender',
    industry_code: 'infrastructure',
    geography: 'tamil_nadu',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 11 - Warehouse Expansion',
    source: 'news',
    project_type: 'warehouse',
    project_status: 'planning',
    industry_code: 'logistics',
    geography: 'ncr',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 12 - Verified Decision Maker',
    source: 'linkedin',
    email: 'cto@lead12.com',
    email_verified_flag: true,
    email_type: 'named',
    decision_maker_title_match_flag: true,
    industry_code: 'it_software',
    geography: 'haryana',
    company_size_band: 'large',
  },
  {
    company_name: 'Lead 13 - Multiple Independent Sources',
    source: 'mixed',
    corroborating_source_count: 4,
    corroborating_source_ids: ['s1', 's2', 's3', 's4'],
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 14 - Single Low-Confidence Source',
    source: 'scraped',
    corroborating_source_count: 0,
    extraction_method: 'scraped',
    data_freshness_days: 150,
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 15 - Recent Hiring Signal',
    source: 'linkedin',
    procurement_role_hiring_flag: true,
    procurement_role_hiring_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    industry_code: 'manufacturing',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 16 - Import/Export Company',
    source: 'trade_data',
    import_shipment_count_trailing_12mo: 15,
    import_shipment_last_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    industry_code: 'export',
    geography: 'gujarat',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 17 - Dead Website',
    source: 'google_maps',
    website_dead_flag: true,
    website: 'https://dead.com',
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 18 - Ayurvedic Manufacturer (FIT Check)',
    source: 'business_directory',
    industry_code: 'healthcare',
    business_type: 'manufacturer',
    opportunity_requirement_tags: ['ayurvedic', 'medicine'],
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 19 - Homeopathy Distributor',
    source: 'business_directory',
    industry_code: 'healthcare',
    business_type: 'distributor',
    opportunity_requirement_tags: ['homeopathy'],
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 20 - Roof Sheet Requirement',
    source: 'rfq',
    opportunity_requirement_tags: ['roof_sheet', 'construction'],
    project_status: 'planning',
    procurement_stage: 'rfq',
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 21 - Old News Article',
    source: 'news',
    data_freshness_days: 400,
    evidence_capture_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 22 - PEB Company',
    source: 'company_website',
    industry_code: 'peb',
    business_type: 'manufacturer',
    geography: 'india',
    company_size_band: 'medium',
  },
  {
    company_name: 'Lead 23 - Healthcare Procurement',
    source: 'rfq',
    industry_code: 'healthcare',
    procurement_stage: 'rfq',
    opportunity_requirement_tags: ['medical_equipment'],
    geography: 'india',
    company_size_band: 'large',
  },
  {
    company_name: 'Lead 24 - Complete vs Missing Fields (Rich vs Sparse)',
    source: 'manual',
    email: 'purchasing@lead24.com',
    phone: '1234567890',
    website: 'https://lead24.com',
    linkedin_url: 'https://linkedin.com/company/lead24',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    industry_code: 'manufacturing',
    company_size_band: 'enterprise',
    geography: 'maharashtra',
    project_status: 'planning',
    tender_value_if_known: 200,
    tender_count_trailing_12mo: 2,
    corroborating_source_count: 2,
  },
  {
    company_name: 'Lead 25 - Sparse Lead (No fields, unknown)',
    source: 'unknown',
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 26 - High Spam Rate Source',
    source: 'scraped',
    source_spam_rate: 0.8,
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 27 - Internal Complaints',
    source: 'crm',
    internal_complaint_count: 4,
    industry_code: 'construction',
    geography: 'india',
    company_size_band: 'small',
  },
  {
    company_name: 'Lead 28 - Urgent Deadline',
    source: 'government_tender',
    urgency_deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days in future
    project_status: 'ongoing',
    procurement_stage: 'tender',
    industry_code: 'infrastructure',
    geography: 'india',
    company_size_band: 'large',
  },
  {
    company_name: 'Lead 29 - Far Deadline',
    source: 'government_tender',
    urgency_deadline_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 300).toISOString(), // 300 days in future
    project_status: 'planning',
    procurement_stage: 'planning',
    industry_code: 'infrastructure',
    geography: 'india',
    company_size_band: 'large',
  },
  {
    company_name: 'Lead 30 - Mixed Contact Channels',
    source: 'linkedin',
    email_present_flag: true,
    phone_present_flag: true,
    website: 'https://lead30.com',
    linkedin_url: 'https://linkedin.com/in/ceo',
    industry_code: 'infrastructure',
    geography: 'india',
    company_size_band: 'medium',
  }
];

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
  console.log(`  Explanation: ${result.explanation}`);
  console.log('');
  console.log('  Top Positive Signals:');
  for (const bullet of result.explanation_bullets) {
    console.log(`    ${bullet}`);
  }

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
}

async function main() {
  console.log('\n' + '═'.repeat(72));
  console.log('  JAS CONNECT — Opportunity Intelligence Engine v1.1');
  console.log('  Terminal Testing Pipeline (Synthetic Leads)');
  console.log('═'.repeat(72));

  let { results, summary } = scoreBatch(syntheticLeads);
  results.forEach((result, idx) => printLead(result, idx + 1));

  console.log('\n' + '═'.repeat(72));
  console.log('  RANKED LEAD LIST (Qualified, by Lead Score)');
  console.log('═'.repeat(72));
  console.log('');
  console.log('  Rank  Score  Company                          OPP     Suppressed  Source');
  console.log('  ────  ─────  ───────────────────────────────  ──────  ──────────  ───────────────');

  let rank = 1;
  const qualified = results.filter(r => r.qualification_passed);
  // Sort qualified by lead score descending
  qualified.sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0));

  for (const r of qualified) {
    const scoreStr = (r.lead_score ?? '-').toString().padStart(5);
    const nameStr = (r.company_name ?? '?').substring(0, 31).padEnd(31);
    const oppStr = (r.opp_bucket ?? '-').padEnd(6);
    const suppStr = r.risk_suppressed ? '⛔ Yes   ' : 'No        ';
    const sourceStr = r.source.substring(0, 20);
    console.log(`  ${String(rank).padStart(4)}  ${scoreStr}  ${nameStr}  ${oppStr}  ${suppStr}  ${sourceStr}`);
    rank++;
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n  ✗ Pipeline test FAILED:');
  console.error(err);
  process.exit(1);
});
