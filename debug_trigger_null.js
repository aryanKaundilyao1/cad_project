import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testInsert() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const mockPayload = {
    title: 'Test Title',
    location: 'Test Location',
    project_type: 'Imported',
    company_name: 'Test Title',
    seller_id: null,
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
  console.log('Status:', res.status);
  console.log('Response:', text);
}

testInsert();
