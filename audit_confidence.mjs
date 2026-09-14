import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  // Task 1: Distribution
  const { data: opps } = await supabase.from('opportunities').select('id, confidence_overall');
  
  let conf0 = 0;
  let conf50 = 0;
  let confOther = {};
  
  for (const opp of opps || []) {
    const conf = opp.confidence_overall;
    if (conf === 0) conf0++;
    else if (conf === 50) conf50++;
    else {
      confOther[conf] = (confOther[conf] || 0) + 1;
    }
  }
  
  console.log("--- TASK 1: DISTRIBUTION ---");
  console.log("0:", conf0);
  console.log("50:", conf50);
  console.log("Other:", confOther);

  // Task 3: One Opportunity
  const targetId = opps.find(o => o.confidence_overall === 50)?.id;
  if (!targetId) return;

  console.log("\n--- TASK 3: SINGLE OPPORTUNITY (" + targetId + ") ---");
  
  // Get opportunity intelligence
  const { data: intel } = await supabase.from('opportunity_intelligence').select('*').eq('opportunity_id', targetId).single();
  if (intel) {
    console.log("Intelligence record:", intel);
    
    // Get signals
    const { data: sigs } = await supabase.from('opportunity_signals')
      .select('*, signal_instance:signal_instances(*)')
      .eq('opportunity_intelligence_id', intel.id);
      
    console.log(`Attached signals (${sigs?.length}):`);
    for (const sig of sigs || []) {
      console.log(`  - Instance ID: ${sig.signal_instance_id}`);
      console.log(`    Relevance Score: ${sig.relevance_score}, Confidence: ${sig.confidence}, Impact: ${sig.impact_score}`);
      console.log(`    Signal Strength: ${sig.signal_instance.strength}`);
    }
  }
  
  // Get opportunity record
  const { data: oppRec } = await supabase.from('opportunities').select('*').eq('id', targetId).single();
  console.log("Final Opportunity Record confidence_overall:", oppRec.confidence_overall);
}

runAudit();
