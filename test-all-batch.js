import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testAll() {
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, company_name, current_score')

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    return
  }
  
  const leadIds = leads.map(l => l.id)
  console.log(`Testing all ${leadIds.length} leads...`)
  
  const { data, error } = await supabase.functions.invoke('run-client-scoring', {
    body: { lead_ids: leadIds }
  })
  
  if (error) {
    console.error("Edge function error:", error)
    if (error.context && error.context.text) {
      console.error("Response text:", await error.context.text())
    }
  } else {
    console.log("Success:", data)
  }
}
testAll()
