import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: account } = await supabase.from('accounts').select('*').eq('id', '2b9cd230-8df8-4c52-9344-5b2687dd7092').single();
  console.log("Account:", JSON.stringify(account, null, 2));
}
run();
