import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('run_query', { query_text: "SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'seller_id';" });
  console.log(data, error);
}

checkSchema();
