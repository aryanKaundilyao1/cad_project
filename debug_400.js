import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testInsert() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const mockPayload = {
    title: 'Test Title',
    company_name: 'Test Title',
    quality_score: null, // Test NULL quality score
    seller_id: 'a181cfe8-86b8-44b1-9f02-9519506b843d'
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
