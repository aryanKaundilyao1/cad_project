import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchAll(table) {
  let allData = [];
  let page = 0;
  while(true) {
    const { data } = await supabase.from(table).select('*').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    page++;
  }
  return allData;
}

async function run() {
  console.log("=== PHASE 1: IMPLEMENTATION ===");
  
  // 1. BACKUP TABLES
  console.log("1. Backing up tables...");
  const oppsBackup = await fetchAll('opportunities');
  const leadsBackup = await fetchAll('leads');
  const accountsBackup = await fetchAll('accounts');
  const companiesBackup = await fetchAll('jas_companies');
  
  fs.writeFileSync('backup_opportunities.json', JSON.stringify(oppsBackup));
  fs.writeFileSync('backup_leads.json', JSON.stringify(leadsBackup));
  fs.writeFileSync('backup_accounts.json', JSON.stringify(accountsBackup));
  fs.writeFileSync('backup_jas_companies.json', JSON.stringify(companiesBackup));
  console.log(`Backed up: ${oppsBackup.length} opps, ${leadsBackup.length} leads.`);

  // 2. DEDUPLICATE OPPORTUNITIES
  console.log("\n2. Deduplicating opportunities...");
  const grouped = {};
  oppsBackup.forEach(o => {
    if (!o.legacy_lead_id) return;
    if (!grouped[o.legacy_lead_id]) grouped[o.legacy_lead_id] = [];
    grouped[o.legacy_lead_id].push(o);
  });

  const idsToDelete = [];
  for (const [leadId, opps] of Object.entries(grouped)) {
    if (opps.length > 1) {
      opps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      for (let i = 1; i < opps.length; i++) {
        idsToDelete.push(opps[i].id);
      }
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`Found ${idsToDelete.length} duplicate opportunities to delete.`);
    for (let i = 0; i < idsToDelete.length; i += 500) {
      const chunk = idsToDelete.slice(i, i + 500);
      const { error } = await supabase.from('opportunities').delete().in('id', chunk);
      if (error) console.error("Error deleting chunk:", error);
    }
    console.log("Deduplication complete.");
  } else {
    console.log("No duplicates found.");
  }

  // 3 & 4. CREATE JAS_COMPANIES
  console.log("\n3 & 4. Creating jas_companies and accounts...");
  const existingCompanyIds = new Set(companiesBackup.map(c => c.id));
  const companiesToInsert = leadsBackup.filter(l => !existingCompanyIds.has(l.id)).map(lead => ({
    id: lead.id,
    company_name: lead.company_name || 'Unknown Company',
    website: lead.website,
    phone: lead.phone,
    industry: lead.industry,
    domain: lead.website ? (new URL(lead.website.startsWith('http') ? lead.website : 'http://' + lead.website).hostname) : null,
    source: 'manual',
    added_by: lead.seller_id
  }));
  
  if (companiesToInsert.length > 0) {
    console.log(`Inserting ${companiesToInsert.length} leads into jas_companies...`);
    for (let i = 0; i < companiesToInsert.length; i += 500) {
      const chunk = companiesToInsert.slice(i, i + 500);
      const { error } = await supabase.from('jas_companies').upsert(chunk);
      if (error) console.error("Error inserting companies chunk:", error);
    }
    console.log("jas_companies inserted.");
    await new Promise(resolve => setTimeout(resolve, 3000));
  } else {
    console.log("jas_companies already populated. Skipping insert.");
  }

  // 5. REPAIR ACCOUNT LINKS
  console.log("\n5. Repairing account links in opportunities...");
  const accounts = await fetchAll('accounts');
  const accountMap = {};
  accounts.forEach(a => {
    if (a.legacy_company_id) {
      accountMap[a.legacy_company_id] = a.id;
    }
  });

  const currentOpps = await fetchAll('opportunities');
  const oppsToUpdate = currentOpps.filter(o => !o.account_id && o.legacy_lead_id && accountMap[o.legacy_lead_id]);

  if (oppsToUpdate.length > 0) {
    console.log(`Found ${oppsToUpdate.length} opportunities needing account_id repair.`);
    let successCount = 0;
    for (let i = 0; i < oppsToUpdate.length; i += 100) {
      const chunk = oppsToUpdate.slice(i, i + 100);
      const promises = chunk.map(opp => 
        supabase.from('opportunities').update({ account_id: accountMap[opp.legacy_lead_id] }).eq('id', opp.id)
      );
      const results = await Promise.all(promises);
      successCount += results.filter(r => !r.error).length;
    }
    console.log(`Successfully repaired ${successCount} opportunities.`);
  } else {
    console.log("No opportunities needed repair.");
  }

  // 6. VALIDATE COUNTS
  console.log("\n6. Validating counts...");
  const { count: finalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
  const { count: finalCompanies } = await supabase.from('jas_companies').select('*', { count: 'exact', head: true });
  const { count: finalAccounts } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
  const { count: finalOpps } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
  const { count: finalNulls } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('account_id', null);

  console.log(`Leads = ${finalLeads}`);
  console.log(`Companies = ${finalCompanies}`);
  console.log(`Accounts = ${finalAccounts}`);
  console.log(`Opportunities = ${finalOpps}`);
  console.log(`Account NULL = ${finalNulls}`);
  
  if (finalLeads === 1004 && finalCompanies === 1004 && finalAccounts === 1004 && finalOpps === 1004 && finalNulls === 0) {
    console.log("\n✅ VALIDATION PASSED: Perfect End State Reached.");
  } else {
    console.log("\n❌ VALIDATION FAILED: Counts do not match expected end state.");
  }
}

run().catch(console.error);
