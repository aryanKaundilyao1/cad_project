import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: opps } = await supabase.from('opportunities').select('id, title, lead_score, legacy_lead_id').eq('lead_score', 24).limit(5);
  console.log("Opps with score 24:", opps);
  
  if (opps && opps.length > 0) {
      const opp = opps[0];
      const { data: lead } = await supabase.from('leads').select('id, title, company_name').eq('id', opp.legacy_lead_id).maybeSingle();
      console.log("Linked Lead:", lead);
  }
}
run();
