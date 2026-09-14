import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: opps } = await supabase.from('opportunities').select('id, title, lead_score, icp_tier, legacy_lead_id').eq('lead_score', 24).limit(5);
  console.log("Opps with score 24:", opps);
}
run();
