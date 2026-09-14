import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', trialId).single();
  console.log("Trial1 Profile:", profile);
}

run();
