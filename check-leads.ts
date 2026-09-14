import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: users } = await supabase.from('profiles').select('id, email, user_type').limit(5);
  console.log("Users:", users);

  const { data: leads, error } = await supabase.from('leads').select('id, seller_id, client_id, company_name, created_by').limit(10);
  console.log("Leads sample:", leads);
  
  if (error) {
     console.error(error);
  }
}

run();
