import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("\n=== STEP 8: VALIDATION ===");
  const { count: siCount } = await supabase.from('signal_instances').select('*', { count: 'exact', head: true });
  const { count: osCount } = await supabase.from('opportunity_signals').select('*', { count: 'exact', head: true });
  const oppCount = 1004;
  console.log(`signal_instances count: ${siCount}`);
  console.log(`opportunity_signals count: ${osCount}`);
  console.log(`average signals per opportunity: ${(osCount / oppCount).toFixed(2)}`);

  console.log("\n=== STEP 9: CONFIDENCE DISTRIBUTION ===");
  const { data: allOpps } = await supabase.from('opportunities').select('id, confidence_overall').not('confidence_overall', 'is', null);
  const confidences = allOpps.map(o => o.confidence_overall).sort((a,b) => a - b);
  if (confidences.length > 0) {
    const min = confidences[0];
    const max = confidences[confidences.length - 1];
    const avg = confidences.reduce((a,b) => a+b, 0) / confidences.length;
    const p10 = confidences[Math.floor(confidences.length * 0.1)];
    const p25 = confidences[Math.floor(confidences.length * 0.25)];
    const p50 = confidences[Math.floor(confidences.length * 0.5)];
    const p75 = confidences[Math.floor(confidences.length * 0.75)];
    const p90 = confidences[Math.floor(confidences.length * 0.9)];
    
    console.log(`Min: ${min}`);
    console.log(`Max: ${max}`);
    console.log(`Average: ${avg.toFixed(2)}`);
    console.log(`P10: ${p10}`);
    console.log(`P25: ${p25}`);
    console.log(`P50: ${p50}`);
    console.log(`P75: ${p75}`);
    console.log(`P90: ${p90}`);
  }

  console.log("\n=== STEP 10: EXAMPLE TRACE ===");
  if (confidences.length > 0) {
    const top = allOpps.reduce((prev, current) => (prev.confidence_overall > current.confidence_overall) ? prev : current);
    const bottom = allOpps.reduce((prev, current) => (prev.confidence_overall < current.confidence_overall) ? prev : current);
    
    await traceOpp(top.id, "Top");
    await traceOpp(bottom.id, "Bottom");
  }
}

async function traceOpp(oppId, label) {
  console.log(`\n-- ${label} Confidence Opportunity: ${oppId} --`);
  const { data: opp } = await supabase.from('opportunities').select('confidence_overall').eq('id', oppId).single();
  const { data: intel } = await supabase.from('opportunity_intelligence').select('id').eq('opportunity_id', oppId).single();
  if (!intel) { console.log("No intelligence found"); return; }
  
  const { data: signals, error: sigErr } = await supabase.from('opportunity_signals')
    .select('*, signal_instances(*, signal_registry(name))')
    .eq('opportunity_intelligence_id', intel.id);
  
  if (sigErr) { console.error("Error fetching signals", sigErr); return; }
  if (!signals || signals.length === 0) { console.log("No signals found"); return; }
  
  let sumWeighted = 0;
  let sumWeights = 0;
  
  for (const sig of signals) {
    const sname = sig.signal_instances.signal_registry?.name;
    const computed = sig.signal_instances.computed_confidence;
    const strength = sig.signal_instances.strength;
    const weight = sig.signal_weights ? sig.signal_weights.weight : 1.0;
    
    console.log(`Signal: ${sname}`);
    console.log(`  Strength: ${strength}`);
    console.log(`  Computed confidence: ${computed}`);
    
    sumWeighted += computed * strength;
    sumWeights += strength;
  }
  
  const weightedConf = sumWeights > 0 ? (sumWeighted / sumWeights).toFixed(2) : 0;
  console.log(`\nWeighted confidence calculation: ${sumWeighted} / ${sumWeights} = ${weightedConf}`);
  console.log(`Final confidence_overall: ${opp.confidence_overall}`);
}

run();
