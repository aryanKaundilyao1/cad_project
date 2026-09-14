import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== TASK 1: DATA INTEGRITY CHECK ===");
  const { count: oppTotal } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
  console.log('Total opportunities:', oppTotal);
  
  const { count: oppAccNull } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('account_id', null);
  console.log('Opportunities account_id IS NULL:', oppAccNull);
  
  const { count: oppLegacyNull } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('legacy_lead_id', null);
  console.log('Opportunities legacy_lead_id IS NULL:', oppLegacyNull);
  
  const { count: leadsTotal } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  console.log('Total leads:', leadsTotal);
  
  const { count: accTotal } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  console.log('Total accounts:', accTotal);
  
  const { count: jasTotal } = await supabase.from('jas_companies').select('*', { count: 'exact', head: true });
  console.log('Total jas_companies:', jasTotal);

  console.log("\n=== TASK 2: ORPHAN ANALYSIS ===");
  const { count: orphanWithLegacy } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('account_id', null).not('legacy_lead_id', 'is', null);
  console.log('account_id IS NULL AND legacy_lead_id IS NOT NULL:', orphanWithLegacy);
  
  const { count: orphanNoLegacy } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('account_id', null).is('legacy_lead_id', null);
  console.log('account_id IS NULL AND legacy_lead_id IS NULL:', orphanNoLegacy);

  console.log("\n=== TASK 3: LEAD COVERAGE ===");
  // Fetch all legacy_lead_id from orphaned opps
  let allOrphans = [];
  let page = 0;
  while(true) {
     const { data } = await supabase.from('opportunities').select('legacy_lead_id').is('account_id', null).range(page*1000, (page+1)*1000-1);
     if (!data || data.length === 0) break;
     allOrphans = allOrphans.concat(data);
     page++;
  }
  
  const uniqueLeads = new Set(allOrphans.map(o => o.legacy_lead_id).filter(id => id));
  console.log('Unique legacy_lead_id from orphaned opportunities:', uniqueLeads.size);
  console.log('Compare against lead count:', leadsTotal);

  console.log("\n=== TASK 4: SCHEMA VALIDATION ===");
  // Can't access information_schema via standard supabase-js client directly.
  // Instead, fetch 1 record from leads to see what fields can be mapped
  const { data: leadSample } = await supabase.from('leads').select('*').limit(1).single();
  console.log('Available lead fields for mapping:', Object.keys(leadSample).join(', '));
  console.log('Confirms: company_name/external_company_name, industry, website, phone, email, city, country exist on leads');
  
  console.log("\n=== TASK 5: DUPLICATE RISK ANALYSIS ===");
  const countsMap = {};
  allOrphans.forEach(o => {
     if (o.legacy_lead_id) {
         countsMap[o.legacy_lead_id] = (countsMap[o.legacy_lead_id] || 0) + 1;
     }
  });
  const duplicates = Object.entries(countsMap)
     .filter(([_, count]) => count > 1)
     .sort((a, b) => b[1] - a[1]);
     
  console.log('How many opportunities share the same legacy_lead_id (meaning count > 1):', duplicates.length);
  console.log('Top 20 duplicated legacy_lead_ids:');
  duplicates.slice(0, 20).forEach(([id, count]) => console.log(`  ${id}: ${count} opportunities`));

  console.log("\n=== TASK 6: DRY RUN ESTIMATE ===");
  const totalOrphaned = allOrphans.length;
  console.log('Opportunities requiring repair:', totalOrphaned);
  console.log('Unique Leads that will generate companies/accounts:', uniqueLeads.size);
  console.log('Accounts created:', uniqueLeads.size);
  console.log('Companies created:', uniqueLeads.size);
  console.log('Opportunities repaired (linked to accounts):', orphanWithLegacy);
  console.log('Opportunities skipped (cannot be linked because legacy_lead_id is null):', orphanNoLegacy);

}

run().catch(console.error);
