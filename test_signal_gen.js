import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== STEP 3: EXECUTION TEST ON ONE OPPORTUNITY ===");
  
  // 1. Get one opportunity with an account
  const { data: opps } = await supabase.from('opportunities').select('id, account_id, accounts(industry, website, workspace_id)').limit(1);
  if (!opps || opps.length === 0) {
    console.log("No opportunities found.");
    return;
  }
  const opp = opps[0];
  console.log(`Testing Opportunity ID: ${opp.id}`);
  
  // 2. Fetch signal registries
  const { data: growthType } = await supabase.from('signal_registry').select('id').eq('name', 'High Growth Indicators').single();
  const { data: matchType } = await supabase.from('signal_registry').select('id').eq('name', 'Target Category Match').single();
  const { data: webType } = await supabase.from('signal_registry').select('id').eq('name', 'Verified Web Presence').single();
  
  if (!growthType || !matchType || !webType) {
    console.log("Missing signal registry types!");
    return;
  }

  // 3. Create intelligence shell
  const { data: intelInsert, error: intelErr } = await supabase.from('opportunity_intelligence').insert({
    opportunity_id: opp.id,
    summary: 'Generating signals from Maps profile...'
  }).select('id');
  
  // If exists, fetch it
  let intelId;
  if (intelErr) {
    const { data: existIntel } = await supabase.from('opportunity_intelligence').select('id').eq('opportunity_id', opp.id).single();
    intelId = existIntel.id;
  } else {
    intelId = intelInsert[0].id;
  }

  const generatedSignals = [];

  // 1. High Growth
  const { data: s1, error: e1 } = await supabase.from('signal_instances').insert({
    account_id: opp.account_id,
    workspace_id: opp.accounts.workspace_id,
    signal_registry_id: growthType.id,
    strength: Math.floor(Math.random() * 30 + 40),
    source: 'google_maps' // Let's verify if google_maps is valid source in signal_instances
  }).select('id').single();
  
  if (e1) console.log("High Growth Signal Error:", e1);
  else {
    generatedSignals.push('High Growth Indicators');
    await supabase.from('opportunity_signals').insert({
      opportunity_intelligence_id: intelId,
      signal_instance_id: s1.id,
      relevance_score: 90
    });
  }

  // 2. Category Match
  if (opp.accounts.industry) {
    const { data: s2, error: e2 } = await supabase.from('signal_instances').insert({
      account_id: opp.account_id,
      workspace_id: opp.accounts.workspace_id,
      signal_registry_id: matchType.id,
      strength: 85,
      source: 'google_maps'
    }).select('id').single();
    if (e2) console.log("Category Match Error:", e2);
    else {
      generatedSignals.push('Target Category Match');
      await supabase.from('opportunity_signals').insert({
        opportunity_intelligence_id: intelId,
        signal_instance_id: s2.id,
        relevance_score: 100
      });
    }
  }

  // 3. Web Presence
  if (opp.accounts.website) {
    const { data: s3, error: e3 } = await supabase.from('signal_instances').insert({
      account_id: opp.account_id,
      workspace_id: opp.accounts.workspace_id,
      signal_registry_id: webType.id,
      strength: 70,
      source: 'google_maps'
    }).select('id').single();
    if (e3) console.log("Web Presence Error:", e3);
    else {
      generatedSignals.push('Verified Web Presence');
      await supabase.from('opportunity_signals').insert({
        opportunity_intelligence_id: intelId,
        signal_instance_id: s3.id,
        relevance_score: 95
      });
    }
  }

  console.log(`Signals detected: ${generatedSignals.length}`);
  console.log(`Signals created: ${generatedSignals.join(', ')}`);
  
  // Recalculate metrics
  const { error: metricsError } = await supabase.rpc('calculate_opportunity_metrics', { p_opportunity_id: opp.id });
  if (metricsError) console.log("Recalculate Error:", metricsError);
  else console.log("Recalculated metrics successfully.");

}

run().catch(console.error);
