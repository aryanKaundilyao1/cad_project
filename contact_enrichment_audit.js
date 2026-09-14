import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== TASK 1: Audit Data Sources ===");

  const { data: opps, error: e1 } = await supabase.from('opportunities').select('id, account_id');
  if (e1) {
     console.error("Error fetching opps:", e1);
     return;
  }

  let metrics = {
      total: opps.length,
      has_phone: 0,
      has_email: 0,
      has_website: 0,
      has_linkedin: 0,
      has_any_contact: 0,
      has_decision_maker: 0
  };

  const accountIds = opps.map(o => o.account_id).filter(Boolean);
  if (accountIds.length === 0) {
      console.log(metrics); return;
  }
  
  // Need to chunk account requests if too large, but 1000 is fine for PostgREST
  const { data: accounts, error: e2 } = await supabase.from('accounts').select('id, phone, email, website, linkedin_url').in('id', accountIds);

  const accountMap = {};
  if (accounts) accounts.forEach(a => accountMap[a.id] = a);

  const { data: contacts, error: e3 } = await supabase.from('contacts').select('account_id, is_decision_maker').in('account_id', accountIds);
  const contactMap = {};
  if (contacts) {
      contacts.forEach(c => {
          if (!contactMap[c.account_id]) contactMap[c.account_id] = [];
          contactMap[c.account_id].push(c);
      });
  }

  opps.forEach(opp => {
      const acc = accountMap[opp.account_id];
      if (acc) {
          if (acc.phone && acc.phone.trim() !== '') metrics.has_phone++;
          if (acc.email && acc.email.trim() !== '') metrics.has_email++;
          if (acc.website && acc.website.trim() !== '') metrics.has_website++;
          if (acc.linkedin_url && acc.linkedin_url.trim() !== '') metrics.has_linkedin++;
      }
      const accContacts = contactMap[opp.account_id] || [];
      if (accContacts.length > 0) metrics.has_any_contact++;
      if (accContacts.some(c => c.is_decision_maker)) metrics.has_decision_maker++;
  });

  console.log(JSON.stringify(metrics, null, 2));
}

run();
