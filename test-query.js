import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data: leads } = await supabase.from('leads').select('id').limit(1)
  if (!leads || leads.length === 0) { console.log("No leads"); return; }
  
  const leadId = leads[0].id;
  console.log("Testing with lead_id:", leadId)
  
  const { data, error } = await supabase.functions.invoke('run-client-scoring', {
    body: { lead_ids: [leadId] }
  })
  
  console.log("Response:", JSON.stringify(data, null, 2))
  console.log("Error:", error)
}
test()
