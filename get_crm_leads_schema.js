import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.rpc('run_query', {
    query_text: "SELECT column_name, ordinal_position FROM information_schema.columns WHERE table_name = 'crm_leads' ORDER BY ordinal_position;"
  });
  console.log("Cols:", data || error);
}
run();
