import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== TASK 1: COUNT ALL RELATED TABLES ===");
  const tables = ['leads', 'raw_leads', 'jas_companies', 'accounts', 'opportunities', 'import_batches', 'import_logs'];
  for (const table of tables) {
     const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
     console.log(`${table}: ${error ? 'Not Found / Error' : count}`);
  }

  console.log("\n=== TASK 2: IMPORT HISTORY ===");
  const { data: batches } = await supabase.from('import_batches').select('*');
  if (batches) {
     batches.forEach(b => console.log(`Batch ${b.id}: created_at=${b.created_at}, status=${b.status}, records=${b.total_records || 'unknown'}`));
  } else {
     console.log("No import_batches table or records found via supabase client.");
  }
  
  // Try to find raw_leads
  const { data: rawLeadsSamples } = await supabase.from('raw_leads').select('upload_batch_id, status, error_message').limit(100);
  if (rawLeadsSamples && rawLeadsSamples.length > 0) {
      const statusCounts = {};
      rawLeadsSamples.forEach(r => statusCounts[r.status] = (statusCounts[r.status] || 0) + 1);
      console.log('raw_leads sample status distribution:', statusCounts);
  }
  
  console.log("\n=== TASK 4: DELETED/ARCHIVED ===");
  // Check leads for deleted_at or archived or status
  const { data: leadStatuses } = await supabase.from('leads').select('status, duplicate_status, spam_flag, lead_status');
  if (leadStatuses) {
     const sCounts = {};
     leadStatuses.forEach(l => {
         const s = l.status || l.lead_status || 'null';
         sCounts[s] = (sCounts[s] || 0) + 1;
     });
     console.log('Lead Status distribution:', sCounts);
     
     const dCounts = {};
     leadStatuses.forEach(l => {
         const d = l.duplicate_status || 'null';
         dCounts[d] = (dCounts[d] || 0) + 1;
     });
     console.log('Lead duplicate_status distribution:', dCounts);
  }

  // Let's see if leads has deleted_at
  const { data: softDeleted } = await supabase.from('leads').select('id, deleted_at').not('deleted_at', 'is', null);
  console.log('Leads with deleted_at:', softDeleted ? softDeleted.length : 'Field missing or 0');
}

run().catch(console.error);
