import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Find an opportunity where the lead has a phone or email
  const { data: opps, error: oppsError } = await supabase
    .from('opportunities')
    .select(`
      id, title, legacy_lead_id, account_id
    `)
    .not('legacy_lead_id', 'is', null)
    .limit(100);

  let targetOpp = null;
  let targetLead = null;
  let targetAccount = null;
  let targetCompany = null;
  let targetContacts = null;

  for (const opp of opps) {
    const { data: lead } = await supabase.from('leads').select('*').eq('id', opp.legacy_lead_id).single();
    if (lead && (lead.phone || lead.email)) {
      targetOpp = opp;
      targetLead = lead;
      const { data: account } = await supabase.from('accounts').select('*').eq('id', opp.account_id).single();
      targetAccount = account;
      if (account && account.legacy_company_id) {
        const { data: company } = await supabase.from('jas_companies').select('*').eq('id', account.legacy_company_id).single();
        targetCompany = company;
      }
      if (account) {
        const { data: contacts } = await supabase.from('contacts').select('*').eq('account_id', account.id);
        targetContacts = contacts;
      }
      break;
    }
  }

  if (targetOpp) {
    console.log("TRACE START:");
    console.log("1. Source values:");
    console.log(`Lead ID: ${targetLead.id}`);
    console.log(`Lead Phone: ${targetLead.phone}`);
    console.log(`Lead Email: ${targetLead.email}`);
    if (targetCompany) {
      console.log(`Company ID: ${targetCompany.id}`);
      console.log(`Company Phone: ${targetCompany.phone}`);
      console.log(`Company Email: ${targetCompany.email}`);
    } else {
      console.log("Company: null");
    }

    console.log("\n2. Destination values:");
    console.log(`Opportunity ID: ${targetOpp.id}`);
    if (targetAccount) {
      console.log(`Account ID: ${targetAccount.id}`);
      console.log(`Account Phone: ${targetAccount.phone}`);
      console.log(`Account Email: ${targetAccount.email}`); // Note: accounts table might not have email
    }
    
    if (targetContacts && targetContacts.length > 0) {
      targetContacts.forEach((c, idx) => {
        console.log(`Contact [${idx}] ID: ${c.id}`);
        console.log(`Contact [${idx}] Phone: ${c.phone}`);
        console.log(`Contact [${idx}] Email: ${c.email}`);
      });
    } else {
      console.log("Contact Phone: null (No contact found)");
      console.log("Contact Email: null (No contact found)");
    }
  } else {
    console.log("No opportunity with lead phone/email found.");
  }
}
run();
