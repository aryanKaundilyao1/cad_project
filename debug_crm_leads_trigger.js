import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkTriggers() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.rpc('run_query', {
    query_text: "SELECT event_object_table, trigger_name, action_statement FROM information_schema.triggers WHERE action_statement ILIKE '%crm_leads%';"
  });
  console.log(error);
}
checkTriggers();
