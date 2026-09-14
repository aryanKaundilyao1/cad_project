const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error("No env vars"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("=== profiles cols ===");
  const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.error("profiles error:", pErr);
  else console.log(Object.keys(pData[0] || {}));

  console.log("=== leads cols ===");
  const { data: lData, error: lErr } = await supabase.from('leads').select('*').limit(1);
  if (lErr) console.error("leads error:", lErr);
  else console.log(Object.keys(lData[0] || {}));

  console.log("=== crm_leads cols ===");
  const { data: cData, error: cErr } = await supabase.from('crm_leads').select('*').limit(1);
  if (cErr) console.error("crm_leads error:", cErr);
  else console.log(Object.keys(cData[0] || {}));
}

check();
