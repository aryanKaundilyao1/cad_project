import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.rpc('run_sql', { sql: "SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'update_lead_total_score_trigger';" })
  console.log("Trigger:", data)
}
test()
