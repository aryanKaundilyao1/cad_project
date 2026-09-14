import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testQuery() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('run_query', { 
    query_text: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'sync_lead_to_opportunity';" 
  });
  console.log(data, error);
}

testQuery();
