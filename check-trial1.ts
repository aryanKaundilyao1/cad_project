import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  const { data: leads1 } = await supabase.from('leads').select('id, seller_id, client_id, company_name').eq('seller_id', trialId);
  console.log("Leads where seller_id is trial1:", leads1?.length);

  const { data: leads2 } = await supabase.from('leads').select('id, seller_id, client_id, company_name').eq('client_id', trialId);
  console.log("Leads where client_id is trial1:", leads2?.length);
  
  const { data: leads3 } = await supabase.from('leads').select('id, seller_id, client_id, company_name').eq('created_by', trialId);
  console.log("Leads where created_by is trial1:", leads3?.length);
  
  const { data: allLeads } = await supabase.from('leads').select('id');
  console.log("Total leads in DB:", allLeads?.length);
}

run();
