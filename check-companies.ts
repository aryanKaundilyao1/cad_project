import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  const { data: company1 } = await supabase.from('jas_companies').select('*').eq('id', trialId);
  console.log("jas_companies with trial1 id:", company1);
  
  const { data: allCompanies } = await supabase.from('jas_companies').select('*').limit(5);
  console.log("all jas_companies:", allCompanies);
  
  // also let's assign all leads generated earlier to the trial1 user so they can see them
  // The leads generated were assigned to seller_id = '1c5a5281-267b-4639-8557-0a6c4546895b'
  const oldId = '1c5a5281-267b-4639-8557-0a6c4546895b';
  console.log(`Reassigning leads from ${oldId} to ${trialId}`);
  const { error } = await supabase.from('leads').update({ seller_id: trialId }).eq('seller_id', oldId);
  if (error) console.error("update error:", error);
  else console.log("Reassigned successfully");
}

run();
