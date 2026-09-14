import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: leads } = await supabase.from('leads').select('id, title, metadata').not('metadata->>oie_score', 'is', null).order('created_at', { ascending: false }).limit(1);
  console.log("Lead Metadata Sample:", leads?.[0]?.metadata?.oie_score);
}
run();
