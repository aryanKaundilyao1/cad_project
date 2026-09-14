import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== TASK 1: Audit contactability_rules ===");
  const { count: rulesCount, error: rErr } = await supabase.from('contactability_rules').select('*', { count: 'exact', head: true });
  console.log("Rows in contactability_rules:", rulesCount);

  console.log("\n=== TASK 2: Distribution of contactability_score ===");
  const { data: scores } = await supabase.from('opportunities').select('contactability_score');
  const vals = scores.map(s => s.contactability_score || 0).sort((a,b) => a - b);
  const min = vals[0];
  const max = vals[vals.length - 1];
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  console.log(`Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(2)}`);

  console.log("\n=== TASK 3 & 4: Investigate One Opportunity ===");
  const { data: opp } = await supabase.from('opportunities').select('id, account_id, contactability_score').limit(1).single();
  console.log(`Analyzing Opp: ${opp.id}, Account: ${opp.account_id}`);
  
  const { data: history } = await supabase.from('opportunity_score_history')
    .select('new_values')
    .eq('opportunity_id', opp.id)
    .eq('trigger_reason', 'contactability_recompute')
    .order('created_at', { ascending: false })
    .limit(1);

  if (history && history.length > 0) {
     console.log("History found. Factors:");
     console.log(history[0].new_values.factors);
  } else {
     console.log("No contactability history found for this opp. Let's check raw data:");
     const { data: acc } = await supabase.from('accounts').select('phone_verification_state, email_verification_state, linkedin_verification_state, website_verification_state').eq('id', opp.account_id).single();
     console.log("Account verification states:", acc);
  }

  console.log("\n=== TASK 5: Execute Recomputation ===");
  const { data: opps } = await supabase.from('opportunities').select('id');
  let successCount = 0;
  for (const o of opps) {
    const { error } = await supabase.rpc('calculate_contactability_score', { p_opportunity_id: o.id });
    if (!error) successCount++;
  }
  console.log(`Recomputed contactability for ${successCount} opportunities.`);

  console.log("\n=== TASK 6: Return New Distribution ===");
  const { data: newScores } = await supabase.from('opportunities').select('contactability_score');
  const newVals = newScores.map(s => s.contactability_score || 0).sort((a,b) => a - b);
  
  if (newVals.length > 0) {
    console.log(`Min: ${newVals[0]}`);
    console.log(`Max: ${newVals[newVals.length - 1]}`);
    console.log(`Avg: ${(newVals.reduce((a,b) => a+b, 0) / newVals.length).toFixed(2)}`);
    console.log(`P25: ${newVals[Math.floor(newVals.length * 0.25)]}`);
    console.log(`P50: ${newVals[Math.floor(newVals.length * 0.50)]}`);
    console.log(`P75: ${newVals[Math.floor(newVals.length * 0.75)]}`);
    console.log(`P90: ${newVals[Math.floor(newVals.length * 0.90)]}`);
  }
}
run();
