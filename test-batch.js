import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  console.log("Fetching leads with score <= 25...")
  const { data: leads, error: fetchError } = await supabase
    .from('leads')
    .select('id, company_name, current_score')
    .lte('current_score', 25)
    .limit(10)

  if (fetchError) {
    console.error("Fetch error:", fetchError)
    return
  }
  
  if (!leads || leads.length === 0) {
    console.log("No leads found with score <= 25.")
    return
  }
  
  console.log(`Found ${leads.length} leads. Invoking edge function...`)
  const leadIds = leads.map(l => l.id)
  
  const { data, error } = await supabase.functions.invoke('run-client-scoring', {
    body: { lead_ids: leadIds }
  })
  
  console.log("Edge function response:", JSON.stringify(data, null, 2))
  if (error) {
    console.error("Edge function error:", error)
    if (error.context && error.context.text) {
      console.error("Response text:", await error.context.text())
    }
  }
  
  // Verify if scores were updated
  const { data: updatedLeads } = await supabase
    .from('leads')
    .select('id, company_name, current_score')
    .in('id', leadIds)
    
  console.log("Updated leads:", JSON.stringify(updatedLeads, null, 2))
}
test()
