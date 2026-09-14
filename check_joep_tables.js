import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('joep_score_snapshots').select('id').limit(1);
  if (error) console.error("joep_score_snapshots missing:", error.message);
  else console.log("joep_score_snapshots exists");
}
run();
