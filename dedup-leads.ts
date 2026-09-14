import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const trialId = 'aa440668-6823-44fa-b14a-7ba95d6b66c8';
  console.log("Fetching leads...");
  const { data: leads, error } = await supabase.from('leads').select('id, company_name, created_at').eq('seller_id', trialId);
  if (error) { console.error("Error fetching", error); return; }
  
  if (!leads) return;
  console.log(`Found ${leads.length} leads.`);
  
  // Group by company name
  const nameMap = new Map<string, any[]>();
  for (const lead of leads) {
    const key = lead.company_name?.toLowerCase().trim() || 'unknown';
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(lead);
  }
  
  const idsToDelete: string[] = [];
  
  for (const [name, duplicates] of nameMap.entries()) {
    if (duplicates.length > 1) {
      // Sort by created_at asc (keep oldest)
      duplicates.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // keep the first one
      for (let i = 1; i < duplicates.length; i++) {
        idsToDelete.push(duplicates[i].id);
      }
    }
  }
  
  console.log(`Found ${idsToDelete.length} duplicate leads to delete.`);
  
  // Delete in batches of 100
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { error: delError } = await supabase.from('leads').delete().in('id', batch);
    if (delError) {
      console.error("Error deleting batch:", delError);
    } else {
      console.log(`Deleted batch of ${batch.length}`);
    }
  }
  
  console.log("Deduplication complete!");
}

run();
