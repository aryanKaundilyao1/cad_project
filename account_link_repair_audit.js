import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("=== TASK 1: OPPORTUNITY CREATION AUDIT ===");
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select(`
      id, title, account_id, created_at, legacy_lead_id
    `)
    .eq('stage', 'qualification')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  for (const opp of opps) {
    let expectedAccountId = null;
    let expectedAccountName = "Unknown";
    
    // Check if it came from leads
    if (opp.legacy_lead_id) {
      const { data: lead } = await supabase.from('leads').select('company_name, external_company_name').eq('id', opp.legacy_lead_id).single();
      if (lead) {
        expectedAccountName = lead.external_company_name || lead.company_name;
        if (expectedAccountName) {
           const { data: acc } = await supabase.from('accounts').select('id').eq('name', expectedAccountName).single();
           if (acc) expectedAccountId = acc.id;
        }
      }
    } else {
       // Search for the account directly by title matching company name
       // The title generated is typically "Company Name - Opportunity"
       let cname = opp.title.replace(' - Opportunity', '');
       const { data: acc } = await supabase.from('accounts').select('id').ilike('name', cname).single();
       if (acc) expectedAccountId = acc.id;
    }

    console.log(`Opp ID: ${opp.id} | Created: ${opp.created_at}`);
    console.log(`Title: ${opp.title}`);
    console.log(`Actual account_id: ${opp.account_id}`);
    console.log(`Expected account_id (based on search): ${expectedAccountId}`);
    console.log("-----------------------------------------");
  }

  console.log("=== TASK 5: ESTIMATE OUTCOME ===");
  // Count how many opportunities could be linked
  let linkable = 0;
  let totalWithNull = 0;
  
  const { data: allOpps } = await supabase.from('opportunities').select('id, title, account_id, legacy_lead_id').eq('stage', 'qualification').is('account_id', null);
  totalWithNull = allOpps.length;
  console.log(`Total qualification opps with account_id = null: ${totalWithNull}`);

}

runAudit().catch(console.error);
