const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: pData } = await supabase.from('profiles').select('*').limit(1);
  console.log("profiles:", Object.keys(pData?.[0] || {}));

  const { data: lData } = await supabase.from('leads').select('*').limit(1);
  console.log("leads:", Object.keys(lData?.[0] || {}));

  const { data: cData } = await supabase.from('crm_leads').select('*').limit(1);
  console.log("crm_leads:", Object.keys(cData?.[0] || {}));
}
run();
