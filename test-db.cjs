require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('jas_companies').select('*').eq('email', 'trial1@jasconnectt.in');
  console.log("Count:", data?.length);
  console.log("Error:", error);
}
run();
