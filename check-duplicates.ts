import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('company_name, id').order('company_name');
  if (error || !leads) { console.error("Error fetching", error); return; }
  
  for(let i = 0; i < leads.length; i++) {
    console.log(leads[i].company_name);
  }
}

run();
