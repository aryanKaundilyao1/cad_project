import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  // Try inserting into sync_logs with ANON key (this simulates what the trigger does under the user's context, since triggers run with the caller's privileges unless SECURITY DEFINER is used)
  const { data, error } = await supabase.from('sync_logs').insert([{
    entity_type: 'lead',
    source_table: 'leads',
    target_table: 'opportunities',
    operation: 'insert'
  }]);
  console.log("Error:", error);
}
run();
