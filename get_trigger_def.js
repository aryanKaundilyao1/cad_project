import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Create a function in the DB to fetch the source code of triggers
  const { data, error } = await supabase.from('leads').select('id').limit(1);
  console.log("Just checking connection:", data ? "OK" : error);
  
  // We can't query system tables via PostgREST, so we must find another way.
}
run();
