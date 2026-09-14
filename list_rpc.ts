import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase.from('pg_proc').select('*').limit(5);
  // PostgREST doesn't expose pg_proc by default.
  // Let's try to query an API docs endpoint
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY! }
  });
  const openapi = await res.json();
  const paths = Object.keys(openapi.paths).filter(p => p.startsWith('/rpc/'));
  console.log('Available RPCs:', paths);
}
run();
