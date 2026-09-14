import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  console.log("Fetching leads...");
  const { data: leads, error } = await supabase.from('leads').select('id').eq('seller_id', trialId);
  if (error || !leads) { console.error("Error fetching", error); return; }
  
  console.log(`Triggering scoring for ${leads.length} leads in batches of 20...`);
  const leadIds = leads.map(l => l.id);
  
  for (let i = 0; i < leadIds.length; i += 20) {
    const batch = leadIds.slice(i, i + 20);
    const { error: invokeError } = await supabase.functions.invoke('run-client-scoring', {
      body: { lead_ids: batch }
    });
    if (invokeError) {
      console.error("Error invoking:", invokeError);
    } else {
      console.log(`Successfully triggered batch ${i/20 + 1}`);
    }
  }
  
  console.log("Completed triggering scores!");
}

run();
