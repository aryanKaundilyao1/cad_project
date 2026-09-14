import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('reload_schema'); // Actually Supabase has a built-in way or we can just send NOTIFY
  console.log("RPC Error:", error);
}
run();
