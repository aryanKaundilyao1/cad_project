import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/run-client-scoring';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const req = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lead_ids: ['bdf5b565-d72b-426b-8711-2bf4fc30edbc'] }) 
  });
  
  const text = await req.text();
  console.log(`Status: ${req.status}`);
  console.log(`Response: ${text}`);
}
run();
