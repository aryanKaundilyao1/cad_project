const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function alterTable() {
  console.log("Adding lead_score column to opportunities table...");
  const { data, error } = await supabase.rpc('test_rpc_run_sql', {
    sql: 'ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS lead_score numeric;'
  });

  if (error) {
    console.error("Failed via RPC, trying a raw query via postgres if available, or just letting you know to run this SQL manually.", error.message);
  } else {
    console.log("Success!", data);
  }
}

alterTable();
