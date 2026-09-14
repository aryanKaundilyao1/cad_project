import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== PHASE 2: SIGNAL ENGINE AUDIT ===");

  // STEP 1: AUDIT COUNTS
  console.log("\n1. Auditing row counts...");
  const tables = [
    'signal_registry',
    'signal_instances',
    'signal_weights',
    'signal_decay_rules',
    'signal_confidence_rules',
    'industry_profiles',
    'opportunity_signals',
    'opportunities'
  ];

  const counts = {};
  for (const t of tables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    counts[t] = count;
    console.log(`${t}: ${count}`);
  }

  // STEP 2 & 3: EXECUTION TEST
  console.log("\n3. Execution Test on ONE opportunity...");
  const { data: opps } = await supabase.from('opportunities').select('id').limit(1);
  if (opps && opps.length > 0) {
    const oppId = opps[0].id;
    console.log(`Testing Opportunity ID: ${oppId}`);
    
    // Check signals before
    const { count: sigBefore } = await supabase.from('opportunity_signals')
      .select('opportunity_intelligence_id(opportunity_id)', { count: 'exact', head: true })
      // Can't filter easily via join on head=true without full query
    
    // Attempt to run evaluate_opportunity or generate_signals
    // Let's try to see if there is an RPC we can call
    const { data: rpcResult, error: rpcError } = await supabase.rpc('evaluate_opportunity', { p_opportunity_id: oppId });
    if (rpcError) {
      console.log(`Error running evaluate_opportunity: ${rpcError.message}`);
    } else {
      console.log(`evaluate_opportunity executed.`);
    }

    // Try calculate_opportunity_metrics
    const { data: metricsResult, error: metricsError } = await supabase.rpc('calculate_opportunity_metrics', { p_opportunity_id: oppId });
    if (metricsError) {
      console.log(`Error running calculate_opportunity_metrics: ${metricsError.message}`);
    }

    // Let's try executing pipeline
    const { data: pipeResult, error: pipeError } = await supabase.rpc('execute_opportunity_pipeline', { p_opportunity_id: oppId });
    if (pipeError) {
      console.log(`Error running execute_opportunity_pipeline: ${pipeError.message}`);
    } else {
      console.log(`execute_opportunity_pipeline executed.`);
    }

    // Since generate_google_maps_signals takes NO arguments, it runs on ALL. We don't want to run it on all!
    
  } else {
    console.log("No opportunities found to test.");
  }

}

run().catch(console.error);
