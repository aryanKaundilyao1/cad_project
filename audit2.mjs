import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('*').limit(50);
  
  if (error) console.error(error);
  
  const leadWithContact = leads.find(l => l.contact_email || l.contact_phone || l.email || l.phone);
  console.log("Lead with contact info:");
  console.log(JSON.stringify(leadWithContact, null, 2));

  if (!leadWithContact) {
    const oppWithLead = await supabase.from('opportunities').select('*, legacy_lead_id').not('legacy_lead_id', 'is', null).limit(1).single();
    const leadId = oppWithLead.data.legacy_lead_id;
    const lData = await supabase.from('leads').select('*').eq('id', leadId).single();
    console.log("Example lead:", JSON.stringify(lData.data, null, 2));
  }
}
run();
