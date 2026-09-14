import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('run_query', {
    query_text: "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'leads';"
  });
  console.log("RPC Error:", error);
}
run();
