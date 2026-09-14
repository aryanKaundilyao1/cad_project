import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: leads, error } = await supabase.from('leads').select('*');
  if (error || !leads) { console.error("Error fetching", error); return; }
  
  console.log(`Found ${leads.length} leads.`);
  
  const uniqueNames = new Map();
  const duplicatesToDelete = [];
  
  for (const lead of leads) {
    if (!lead.company_name) continue;
    // Normalize name
    const normalizedName = lead.company_name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    if (uniqueNames.has(normalizedName)) {
      duplicatesToDelete.push(lead.id);
    } else {
      uniqueNames.set(normalizedName, lead.id);
    }
  }
  
  console.log(`Found ${duplicatesToDelete.length} duplicate leads to delete based on name.`);
  
  if (duplicatesToDelete.length > 0) {
    for (let i = 0; i < duplicatesToDelete.length; i += 100) {
      const batch = duplicatesToDelete.slice(i, i + 100);
      const { error: delError } = await supabase.from('leads').delete().in('id', batch);
      if (delError) console.error("Error deleting batch:", delError);
      else console.log(`Deleted batch of ${batch.length}`);
    }
  }
  console.log("Deduplication complete!");
}

run();
