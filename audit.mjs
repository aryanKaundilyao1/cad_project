import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Starting audit...");

  // 1. Get an opportunity mapped to an account, which is mapped to a company, which is mapped to a lead.
  // Wait, let's query opportunities where legacy_lead_id is not null
  
  const { data: opps, error: oppsError } = await supabase
    .from('opportunities')
    .select(`
      id, title, legacy_lead_id, account_id
    `)
    .not('legacy_lead_id', 'is', null)
    .limit(5);

  if (oppsError) {
    console.error("Error fetching opps:", oppsError);
    return;
  }

  for (const opp of opps) {
    console.log(`\n--- Auditing Opportunity: ${opp.id} ---`);
    console.log(`Opportunity ID: ${opp.id}`);
    
    // Get account
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', opp.account_id)
      .single();
      
    if (!account) {
      console.log("No account found");
      continue;
    }
    console.log(`Account ID: ${account.id}, legacy_company_id: ${account.legacy_company_id}`);
    console.log(`Account Phone: ${account.phone}, Email: ${account.email}`);

    // Get company
    let company = null;
    if (account.legacy_company_id) {
      const { data: comp } = await supabase
        .from('jas_companies')
        .select('*')
        .eq('id', account.legacy_company_id)
        .single();
      company = comp;
      if (company) {
        console.log(`Company ID: ${company.id}`);
        console.log(`Company Phone: ${company.phone}, Email: ${company.email}`);
      }
    }

    // Get lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', opp.legacy_lead_id)
      .single();
      
    if (lead) {
      console.log(`Lead ID: ${lead.id}`);
      console.log(`Lead Phone: ${lead.phone}, Email: ${lead.email}`);
      console.log(`Lead Contact Email: ${lead.contact_email}, Contact Phone: ${lead.contact_phone}`);
    }

    // Get contact
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', account.id);
      
    if (contacts && contacts.length > 0) {
      console.log(`Contacts found: ${contacts.length}`);
      for (const c of contacts) {
        console.log(`Contact ID: ${c.id}, Phone: ${c.phone}, Email: ${c.email}`);
      }
    } else {
      console.log("No contacts found for this account.");
    }
  }
}
run();
