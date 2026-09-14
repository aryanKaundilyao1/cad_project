import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Check latest opportunity
  const { data: opps, error: oppErr } = await supabase
    .from('opportunities')
    .select('id, title, lead_score, icp_tier, oie_score, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
    
  console.log("Recent Opportunities:");
  console.log(JSON.stringify(opps, null, 2));
  console.log("Opp Error:", oppErr);
  
  if (opps && opps.length > 0) {
    const oppIds = opps.map(o => o.id);
    const { data: scores, error: scoreErr } = await supabase
      .from('opportunity_scores')
      .select('*')
      .in('opportunity_id', oppIds);
    console.log("\nOpportunity Scores:");
    console.log(JSON.stringify(scores, null, 2));
    console.log("Score Error:", scoreErr);
  }
}
run();
