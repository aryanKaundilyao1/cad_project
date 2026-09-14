import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('metadata').limit(5);
  if (error || !leads) { console.error("Error fetching", error); return; }
  
  for(let i = 0; i < leads.length; i++) {
    console.log(JSON.stringify(leads[i].metadata, null, 2));
  }
}

run();
