import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase.from('leads').select('company_name, current_score, main_category, reviews, rating').order('current_score', { ascending: false }).limit(20)
  console.log("Top Scores:", JSON.stringify(data, null, 2))
}
test()
