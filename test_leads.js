import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('leads').select('id, title, status, is_public, is_verified, industry, industry_id, category').order('created_at', { ascending: false }).limit(5);
  console.log("Leads error:", error);
  console.log("Recent leads:");
  console.table(data);
}
check();
