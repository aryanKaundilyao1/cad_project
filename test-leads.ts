import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data, error } = await supabase.from('leads').select('company_name, current_score').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}

run();
