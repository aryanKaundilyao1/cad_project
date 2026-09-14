import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('leads').select('metadata').limit(50);
  if (error) {
    console.error(error);
    return;
  }
  
  const allKeys = new Set();
  const sampleMetas = [];
  
  data.forEach(lead => {
    if (lead.metadata) {
      Object.keys(lead.metadata).forEach(k => allKeys.add(k));
      if (JSON.stringify(lead.metadata).toLowerCase().includes('@')) {
        sampleMetas.push(lead.metadata);
      }
    }
  });
  
  console.log("All unique keys found in metadata:");
  console.log(Array.from(allKeys));
  
  console.log("\nSample metadata objects containing an '@' symbol:");
  sampleMetas.slice(0, 3).forEach((meta, idx) => {
    console.log(`\n--- Sample ${idx + 1} ---`);
    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === 'string' && v.includes('@')) {
         console.log(`KEY: ${k} => VALUE: ${v}`);
      } else if (Array.isArray(v) && JSON.stringify(v).includes('@')) {
         console.log(`KEY: ${k} => VALUE (Array): ${JSON.stringify(v)}`);
      }
    }
  });
}
check();
