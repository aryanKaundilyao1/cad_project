import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.from('opportunities').select('*').limit(1)
  console.log("Response:", JSON.stringify(data, null, 2))
  console.log("Error:", error)
}
test()
