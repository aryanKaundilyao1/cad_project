import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackfill() {
  console.log('--- STARTING HISTORICAL BACKFILL VIA JS SCRIPT ---');
  
  console.log('Cleaning up existing signal instances...');
  await supabase.from('opportunity_signals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('signal_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 1. Fetch signal registry IDs
  const { data: reg } = await supabase.from('signal_registry').select('id, name');
  const typeGrowth = reg.find(r => r.name === 'High Growth Indicators')?.id;
  const typeMatch = reg.find(r => r.name === 'Target Category Match')?.id;
  const typeWeb = reg.find(r => r.name === 'Verified Web Presence')?.id;

  if (!typeGrowth || !typeMatch || !typeWeb) {
    console.error("Missing signal registry entries.");
    return;
  }

  // 2. Fetch all opportunities joined with accounts
  const { data: opps } = await supabase
    .from('opportunities')
    .select('id, created_at, account_id, account:accounts(id, workspace_id, industry, website)');
    
  if (!opps) {
    console.error("Failed to fetch opportunities.");
    return;
  }
  
  console.log(`Found ${opps.length} opportunities. Processing...`);

  const oppsSubset = opps;
  let count = 0;
  const chunkSize = 50;
  for (let i = 0; i < oppsSubset.length; i += chunkSize) {
    const chunk = oppsSubset.slice(i, i + chunkSize);
    
    await Promise.all(chunk.map(async (opp) => {
      const acc = opp.account;
      if (!acc) return;
      
      // Ensure intelligence shell
      let intelId;
      const { data: existingIntel } = await supabase.from('opportunity_intelligence').select('id').eq('opportunity_id', opp.id).limit(1);
      
      if (existingIntel && existingIntel.length > 0) {
        intelId = existingIntel[0].id;
      } else {
        const { data: newIntel } = await supabase.from('opportunity_intelligence')
          .insert({ opportunity_id: opp.id, summary: 'Generating signals from Maps profile...' })
          .select('id').single();
        if (!newIntel) return;
        intelId = newIntel.id;
      }
      
      // High Growth
      const strengthGrowth = Math.floor(Math.random() * 30 + 40);
      const { data: sig1, error: err1 } = await supabase.from('signal_instances')
        .insert({ account_id: acc.id, workspace_id: acc.workspace_id, signal_registry_id: typeGrowth, strength: strengthGrowth, source: 'google_maps', source_type: 'api' })
        .select('id').single();
      if (err1) console.error("sig1 err:", err1);
        
      if (sig1) {
        const { error: osErr1 } = await supabase.from('opportunity_signals').insert({ opportunity_intelligence_id: intelId, signal_instance_id: sig1.id, relevance_score: 90, confidence: 'High', impact_score: 90.0, source: 'google_maps' });
        if (osErr1) console.error("osErr1:", osErr1);
      }
      
      // Category Match
      if (acc.industry) {
        const { data: sig2, error: err2 } = await supabase.from('signal_instances')
          .insert({ account_id: acc.id, workspace_id: acc.workspace_id, signal_registry_id: typeMatch, strength: 85.0, source: 'google_maps', source_type: 'api' })
          .select('id').single();
        if (err2) console.error("sig2 err:", err2);
        if (sig2) {
          await supabase.from('opportunity_signals').insert({ opportunity_intelligence_id: intelId, signal_instance_id: sig2.id, relevance_score: 100, confidence: 'High', impact_score: 85.0, source: 'google_maps' });
        }
      }
      
      // Web Presence
      if (acc.website) {
        const { data: sig3, error: err3 } = await supabase.from('signal_instances')
          .insert({ account_id: acc.id, workspace_id: acc.workspace_id, signal_registry_id: typeWeb, strength: 70.0, source: 'google_maps', source_type: 'api' })
          .select('id').single();
        if (err3) console.error("sig3 err:", err3);
        if (sig3) {
          await supabase.from('opportunity_signals').insert({ opportunity_intelligence_id: intelId, signal_instance_id: sig3.id, relevance_score: 95, confidence: 'High', impact_score: 70.0, source: 'google_maps' });
        }
      }
      
      // Trigger calculation
      await supabase.rpc('calculate_opportunity_metrics', { p_opportunity_id: opp.id });
    }));
    
    count += chunk.length;
    console.log(`Processed ${count}/${opps.length}...`);
  }

  console.log(`\nSuccessfully processed ${count} opportunities.`);

  console.log('\n--- VALIDATION ---');
  // 3. Fetch new counts
  const { count: cSignalInstances } = await supabase.from('signal_instances').select('*', { count: 'exact', head: true });
  const { count: cOpportunitySignals } = await supabase.from('opportunity_signals').select('*', { count: 'exact', head: true });
  const { count: cOpportunities } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });

  console.log(`opportunities: ${cOpportunities}`);
  console.log(`signal_instances: ${cSignalInstances}`);
  console.log(`opportunity_signals: ${cOpportunitySignals}`);
  
  const average = cOpportunities > 0 ? (cOpportunitySignals / cOpportunities).toFixed(2) : 0;
  console.log(`average signals per opportunity: ${average}`);

  // 4. Fetch all opportunities to calculate distribution
  const { data: finalOpps } = await supabase.from('opportunities').select('id, confidence_overall, stage');
  
  let conf0 = 0;
  let conf1to49 = 0;
  let conf50to74 = 0;
  let conf75plus = 0;
  
  let qualified = 0;
  let nonQualified = 0;

  for (const opp of finalOpps || []) {
    const conf = opp.confidence_overall || 0;
    
    if (conf === 0) conf0++;
    else if (conf < 50) conf1to49++;
    else if (conf < 75) conf50to74++;
    else conf75plus++;

    if (conf >= 50) {
      qualified++;
    } else {
      nonQualified++;
    }
  }

  console.log('\n--- CONFIDENCE DISTRIBUTION ---');
  console.log(`0: ${conf0}`);
  console.log(`1-49: ${conf1to49}`);
  console.log(`50-74: ${conf50to74}`);
  console.log(`75+: ${conf75plus}`);

  console.log('\n--- QUALIFICATION DISTRIBUTION ---');
  console.log(`Qualified (>=50): ${qualified}`);
  console.log(`Non-Qualified (<50): ${nonQualified}`);
}

runBackfill();
