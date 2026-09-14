import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: scores } = await supabase.from('opportunity_scores').select('*').limit(1);
  console.log("Opportunity Scores Sample:", scores?.[0]);
}
run();
