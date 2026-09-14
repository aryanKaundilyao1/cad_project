import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: profiles } = await supabase.from('profiles').select('id, user_id').limit(1);
  const p = profiles[0];
  
  console.log("Using Profile ID:", p.id);
  console.log("Using User ID:", p.user_id);
  
  const mockLead = {
    title: 'FKEY Test',
    location: 'Test',
    project_type: 'Test',
    company_name: 'FKEY Test',
    source_type: 'import'
  };

  // Test 1: seller_id = profile.id
  let res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
    method: 'POST',
    headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ ...mockLead, seller_id: p.id }])
  });
  console.log('Status with profile.id:', res.status, await res.text());

  // Test 2: seller_id = profile.user_id
  res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
    method: 'POST',
    headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ ...mockLead, seller_id: p.user_id }])
  });
  console.log('Status with user_id:', res.status, await res.text());
}
run();
