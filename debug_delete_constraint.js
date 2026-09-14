import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkDelete() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // try to delete a single lead that has an opportunity
  const { data: opps } = await supabase.from('opportunities').select('legacy_lead_id').not('legacy_lead_id', 'is', null).limit(1);
  if (opps && opps.length > 0) {
    const leadId = opps[0].legacy_lead_id;
    console.log("Trying to delete lead:", leadId);
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    console.log("Delete error:", error);
  } else {
    console.log("No opps found");
  }
}
checkDelete();
