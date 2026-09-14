import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // try inserting an opp pointing to a non-existent lead
  const { data, error } = await supabase.from('opportunities').insert([{
    id: crypto.randomUUID(),
    legacy_lead_id: crypto.randomUUID(),
    workspace_id: '1c5a5281-267b-4639-8557-0a6c4546895b',
    title: 'Test',
  }]);
  
  console.log("Error:", error);
}
run();
