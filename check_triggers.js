import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { 
     query: "SELECT tgname, relname FROM pg_trigger JOIN pg_class ON tgrelid = pg_class.oid WHERE relname = 'opportunities'" 
  });
  console.log(data, error);
}

run();
