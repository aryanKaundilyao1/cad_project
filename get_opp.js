import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: opp } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false }).limit(1);
  console.log("Opp Sample:", opp);
}
run();
