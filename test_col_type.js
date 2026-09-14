import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('opportunity_scores').insert([{opportunity_id: '461a7974-93bc-44f0-971f-334c9dbf9ca3', score_version: 'oie-v1.0.0'}]);
  console.log("Error:", error);
}
run();
