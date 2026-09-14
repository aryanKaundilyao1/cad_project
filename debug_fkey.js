import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkFkey() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try inserting a lead with seller_id from a known profile
  const { data: profiles } = await supabase.from('profiles').select('id, user_id, role').limit(2);
  console.log("Found profiles:", profiles);
  
  if (profiles.length > 0) {
    const mockPayload = {
      title: 'FKEY Test',
      location: 'Test Location',
      project_type: 'Imported',
      company_name: 'FKEY Test',
      seller_id: profiles[0].id,
      source_type: 'import'
    };

    const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([mockPayload])
    });

    const text = await res.text();
    console.log('Status with profile.id:', res.status, text);
    
    // Now test with user_id
    const mockPayload2 = { ...mockPayload, seller_id: profiles[0].user_id };
    const res2 = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/leads?select=id', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([mockPayload2])
    });

    const text2 = await res2.text();
    console.log('Status with user_id:', res2.status, text2);
  }
}

checkFkey();
