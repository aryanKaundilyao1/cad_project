import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try to insert a dummy lead and see what trigger fails exactly
  const mockLead = {
    title: 'Trigger Test',
    location: 'Test Location',
    project_type: 'Test',
    company_name: 'Trigger Test Co',
    seller_id: '1c5a5281-267b-4639-8557-0a6c4546895b',
    source_type: 'import',
    niche: 'Real Estate'
  };

  const { data, error } = await supabase.from('leads').insert([mockLead]);
  console.log("Insert Error:", JSON.stringify(error, null, 2));
}
run();
