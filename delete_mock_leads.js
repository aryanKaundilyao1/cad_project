import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase URL or service role key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Deleting old mock leads from the `leads` table...");
  // Delete all leads since the user requested to remove old mock leads and will upload new ones.
  const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error("Error deleting leads:", error);
  } else {
    console.log("Successfully removed old mock leads.");
  }
}

run();
