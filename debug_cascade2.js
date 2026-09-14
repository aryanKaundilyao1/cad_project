import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Find an opp that has a legacy_lead_id which no longer exists in leads
  const { data: opps } = await supabase.from('opportunities').select('id, legacy_lead_id');
  const { data: leads } = await supabase.from('leads').select('id');
  
  const leadIds = new Set(leads.map(l => l.id));
  let orphanedOpps = 0;
  for (const opp of opps) {
    if (opp.legacy_lead_id && !leadIds.has(opp.legacy_lead_id)) {
      orphanedOpps++;
    }
  }
  console.log("Orphaned Opps count:", orphanedOpps);
}
run();
