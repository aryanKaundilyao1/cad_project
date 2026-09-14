import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: res, error } = await supabase.rpc('test_metrics', { p_opp_id: '02e4a388-6b99-4e87-a677-756c75384b0f' });
  console.log(res || error);
}

run();
