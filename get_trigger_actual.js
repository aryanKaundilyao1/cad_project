import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.from('crm_leads').insert([{
    assigned_to: '1c5a5281-267b-4639-8557-0a6c4546895b',
    company: 'Test',
    name: null,
    source_type: 'auto'
  }]);
  console.log("Direct insert error:", error);
}
run();
