import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase
    .from('lead_score_history')
    .insert({
      lead_id: '71c575a7-7b44-43e0-b5df-61f00ef30a5e',
      total_score: 50,
      confidence: 'Medium',
      reason_codes: [],
      module_trigger: 'test'
    })
  console.log("Response:", JSON.stringify(data, null, 2))
  console.log("Error:", error)
}
test()
