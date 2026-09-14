import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('*').ilike('company_name', '%TrainMore%');
  if (error || !leads) { console.error("Error fetching", error); return; }
  
  for(let i = 0; i < leads.length; i++) {
    console.log(leads[i].company_name);
    console.log('phone in lead row:', leads[i].phone);
    console.log('phone in metadata:', leads[i].metadata?.phone);
    console.log('website in lead row:', leads[i].website);
    console.log('website in metadata:', leads[i].metadata?.website);
    console.log('contact_name in lead row:', leads[i].contact_name);
    console.log('owner_name in lead row:', leads[i].owner_name);
  }
}

run();
