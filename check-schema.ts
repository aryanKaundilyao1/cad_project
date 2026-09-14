import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data, error } = await supabase.rpc('get_leads_schema_info'); // if exists
  console.log("try simple select of a lead");
  const { data: leads, error: leadsErr } = await supabase.from('leads').select('*').limit(1);
  console.log(leads, leadsErr);
}

run();
