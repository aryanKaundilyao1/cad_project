import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  let query = supabase
        .from('leads')
        .select(`
          id,
          company_name,
          current_score,
          current_confidence,
          industry,
          country,
          contact_name,
          owner_name,
          updated_at,
          research_completeness,
          metadata
        `)
        .eq('seller_id', trialId);

  const { data, error } = await query;
  console.log("Error:", error);
  console.log("Data count:", data?.length);
  if (data?.length > 0) {
     console.log("First lead:", data[0].company_name);
  }
}
run();
