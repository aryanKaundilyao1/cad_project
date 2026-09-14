import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('joep_entities').select('id').limit(1);
  if (error) console.error("joep_entities missing:", error.message);
  else console.log("joep_entities exists");
  
  const { data: leadsData, error: leadsErr } = await supabase.from('leads').select('id').limit(1);
  if (leadsErr) console.error("leads missing:", leadsErr.message);
  else console.log("leads exists");
}
run();
