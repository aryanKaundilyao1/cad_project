import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  const { data: lead, error } = await supabase.from('leads').select('*').eq('seller_id', trialId).limit(1).single();
  console.log("Single lead:", lead ? "Found" : "Not Found");
  if (error) console.error("Error:", error.message);
  
  if (lead) {
     const hasMetadata = 'metadata' in lead;
     console.log("Has metadata column:", hasMetadata);
     if (!hasMetadata) {
       console.log("Keys available:", Object.keys(lead));
     }
  }
}

run();
