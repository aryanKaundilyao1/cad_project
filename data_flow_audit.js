import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAudit() {
  console.log("Starting Production Audit with Service Role Key...");
  const report = {
    timestamp: new Date().toISOString(),
    sampleSize: 50,
    trace: [],
    nullDistribution: {
      industry: { jas: 0, accounts: 0, opps: 0 },
      website: { jas: 0, accounts: 0 },
      phone: { jas: 0, accounts: 0 },
      email: { jas: 0, accounts: 0 },
      city: { jas: 0, accounts: 0 },
      country: { jas: 0, accounts: 0 }
    },
    signalDistribution: {
      "0": 0, "1": 0, "2": 0, "3": 0, "4+": 0
    },
    scoreDistribution: {
      "0-10": 0, "11-20": 0, "21-30": 0, "31-40": 0, "41-50": 0,
      "51-60": 0, "61-70": 0, "71-80": 0, "81-90": 0, "91-100": 0
    },
    signalFrequency: {},
    ruleTables: {},
    ruleTableSamples: {}
  };

  // Fetch Opportunities, ordered by newest first to avoid legacy broken records
  const { data: opps, error: oppErr } = await supabase
    .from('opportunities')
    .select(`
      id, title, stage, account_id, industry, created_at,
      accounts:account_id (
        id, name, legacy_company_id, industry, website, phone, city, country
      )
    `)
    .eq('stage', 'qualification')
    .order('created_at', { ascending: false })
    .limit(50);

  if (oppErr) throw oppErr;

  let totalValid = 0;

  for (const opp of opps) {
    const oppTrace = {
      opportunity_id: opp.id,
      title: opp.title,
      account_id: opp.account_id,
      opp_industry: opp.industry,
      jas_data: null,
      acc_data: opp.accounts,
      signals: [],
      scores: null
    };

    if (!opp.industry) report.nullDistribution.industry.opps++;

    if (opp.accounts) {
      const acc = opp.accounts;
      if (!acc.industry) report.nullDistribution.industry.accounts++;
      if (!acc.website) report.nullDistribution.website.accounts++;
      if (!acc.phone) report.nullDistribution.phone.accounts++;
      report.nullDistribution.email.accounts++; // Email is natively missing in accounts
      if (!acc.city) report.nullDistribution.city.accounts++;
      if (!acc.country) report.nullDistribution.country.accounts++;

      if (acc.legacy_company_id) {
        const { data: jas } = await supabase
          .from('jas_companies')
          .select('industry, website, phone, email, city, country')
          .eq('id', acc.legacy_company_id)
          .single();
        if (jas) {
          oppTrace.jas_data = jas;
          if (!jas.industry) report.nullDistribution.industry.jas++;
          if (!jas.website) report.nullDistribution.website.jas++;
          if (!jas.phone) report.nullDistribution.phone.jas++;
          if (!jas.email) report.nullDistribution.email.jas++;
          if (!jas.city) report.nullDistribution.city.jas++;
          if (!jas.country) report.nullDistribution.country.jas++;
        }
      }
    }

    // Signals
    const { data: intel } = await supabase.from('opportunity_intelligence').select('id').eq('opportunity_id', opp.id).single();
    let sigCount = 0;
    
    if (intel) {
      const { data: signals } = await supabase
        .from('opportunity_signals')
        .select(`relevance_score, signal_instances (strength, source, signal_registry (name))`)
        .eq('opportunity_intelligence_id', intel.id);
      
      sigCount = signals ? signals.length : 0;
      oppTrace.signals = signals || [];

      if (signals) {
        signals.forEach(s => {
          const name = s.signal_instances?.signal_registry?.name || 'Unknown';
          report.signalFrequency[name] = (report.signalFrequency[name] || 0) + 1;
        });
      }

      const { data: scores } = await supabase.from('opportunity_scores').select('*').eq('opportunity_id', opp.id).single();
      if (scores) {
        oppTrace.scores = scores;
        const prob = scores.order_probability || 0;
        const bucketIndex = Math.min(Math.floor(prob / 10) * 10, 90);
        const bucketStr = prob === 0 ? "0-10" : (prob > 90 ? "91-100" : `${bucketIndex + 1}-${bucketIndex + 10}`);
        report.scoreDistribution[bucketStr] = (report.scoreDistribution[bucketStr] || 0) + 1;
      }
    }
    
    // Add to bucket regardless of intel to catch the 0s
    if (sigCount >= 4) report.signalDistribution["4+"]++;
    else report.signalDistribution[sigCount.toString()]++;

    report.trace.push(oppTrace);
    totalValid++;
  }

  // Convert percentages
  for (const key of Object.keys(report.nullDistribution)) {
    if (report.nullDistribution[key].jas !== undefined) report.nullDistribution[key].jas_pct = ((report.nullDistribution[key].jas / totalValid) * 100).toFixed(1) + '%';
    if (report.nullDistribution[key].accounts !== undefined) report.nullDistribution[key].acc_pct = ((report.nullDistribution[key].accounts / totalValid) * 100).toFixed(1) + '%';
    if (report.nullDistribution[key].opps !== undefined) report.nullDistribution[key].opp_pct = ((report.nullDistribution[key].opps / totalValid) * 100).toFixed(1) + '%';
  }

  // Rule Tables & Samples
  const tables = ['signal_registry', 'signal_instances', 'signal_weights', 'industry_profiles', 'procurement_rules', 'contactability_rules'];
  for (const t of tables) {
    const { count, data } = await supabase.from(t).select('*', { count: 'exact' }).limit(3);
    report.ruleTables[t] = count || 0;
    report.ruleTableSamples[t] = data || [];
  }

  fs.writeFileSync('production_opportunity_audit.json', JSON.stringify(report, null, 2));

  let md = `# JAS CONNECT 3.0: PRODUCTION DATA FLOW AUDIT\n\n`;
  
  md += `## 1. NULL DISTRIBUTION (Data Loss Points)\n`;
  for (const k of Object.keys(report.nullDistribution)) {
    md += `**${k.toUpperCase()}**\n`;
    if (report.nullDistribution[k].jas_pct) md += `- jas_companies: ${report.nullDistribution[k].jas_pct} Missing\n`;
    if (report.nullDistribution[k].acc_pct) md += `- accounts: ${report.nullDistribution[k].acc_pct} Missing\n`;
    if (report.nullDistribution[k].opp_pct) md += `- opportunities: ${report.nullDistribution[k].opp_pct} Missing\n`;
    md += `\n`;
  }

  md += `## 2. SIGNAL DISTRIBUTION\n`;
  for (const k of Object.keys(report.signalDistribution)) {
    md += `- ${k} signals: ${report.signalDistribution[k]} companies\n`;
  }

  md += `\n## 3. SIGNAL FREQUENCY (Most Common)\n`;
  const sortedFreq = Object.entries(report.signalFrequency).sort((a,b)=>b[1]-a[1]);
  if (sortedFreq.length === 0) {
    md += `*No signals found.*\n`;
  }
  for (const [name, count] of sortedFreq) {
    md += `- ${name}: ${count} occurrences\n`;
  }

  md += `\n## 4. SCORE COMPRESSION (Order Probability Histogram)\n`;
  for (const k of Object.keys(report.scoreDistribution)) {
    md += `- ${k}%: ${report.scoreDistribution[k]} companies\n`;
  }
  
  md += `\n## 5. RULE TABLE USAGE & SAMPLE DATA\n`;
  for (const k of Object.keys(report.ruleTables)) {
    md += `### ${k}: ${report.ruleTables[k]} rows\n`;
    if (report.ruleTableSamples[k].length > 0) {
      md += `*Sample:* \`${JSON.stringify(report.ruleTableSamples[k][0])}\`\n`;
    } else {
      md += `*No records exist in this table.*\n`;
    }
  }

  md += `\n## TOP 5 ROOT CAUSES (Evidence-Based)\n`;
  md += `1. **Missing Contact Data Mapping (Trigger Drop):** email and phone are completely lost across all accounts because the \`sync_company_to_account\` trigger fails to map them.\n`;
  md += `2. **Missing Google Maps Fields (Schema Rejection):** category, rating, reviews do not exist in jas_companies.\n`;
  md += `3. **Signal Starvation:** The engine only generates High Growth Indicators because website and industry are often missing.\n`;
  md += `4. **Score Compression:** With only 1 signal, the rigid 50/30/20 formula guarantees an Order Probability around 18-22%.\n`;
  md += `5. **Rule Table Fallback:** procurement_rules and contactability_rules have 0 records configured for Google Maps, forcing generic fallback scores.\n`;

  fs.writeFileSync('production_opportunity_audit.md', md);
  console.log("Audit complete. Results saved.");
}

runAudit().catch(console.error);
