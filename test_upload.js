import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, icp_tier, leads(metadata)')
    .eq('source_upload_id', 'upload_1784564350730') // wait, source_upload_id is on leads?
    .limit(5);
    
  if (error) console.error("Error:", error);
  console.log(JSON.stringify(data, null, 2));
}
run();
