import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkFkey() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: profiles, error } = await supabase.from('profiles').select('id, user_id, role').limit(2);
  console.log("Error:", error);
  console.log("Profiles:", profiles);
}
checkFkey();
