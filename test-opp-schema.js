import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.rpc('run_sql', { sql: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'opportunities'::regclass;" })
  console.log("Constraints:", data)
}
test()
