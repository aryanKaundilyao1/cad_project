import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log("\n==== PIPELINE VERIFICATION REPORT ====\n");
  
  // 1. Raw upload_rows count
  const { count: rawRowsCount } = await supabase.from('upload_rows').select('*', { count: 'exact', head: true });
  console.log("Total Raw Upload Rows in DB:", rawRowsCount);
  
  // 2. Scored Leads
  const { count: oppsCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
  console.log("Total Opportunities (OIE Base):", oppsCount);
  
  // 3. T1, T2, T3
  const { count: t1 } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T1');
  const { count: t2 } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T2');
  const { count: t3 } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('icp_tier', 'T3');
  const { count: un } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).is('icp_tier', null);
  
  console.log("  - T1 Core:", t1);
  console.log("  - T2 Adjacent:", t2);
  console.log("  - T3 Nurture:", t3);
  console.log("  - Unscored/Unknown:", un);
  
  // 4. Leads public count
  const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('is_public', true);
  console.log("Total Migrated Leads (is_public=true):", leadsCount);
  
  console.log("\n======================================\n");
}
run();
