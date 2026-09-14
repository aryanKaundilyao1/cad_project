const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  const { data: nicheData, error: err } = await supabase.from('niches').select('*').limit(1);
  if (err) console.error("Niches error:", err.message);
  else console.log("Niches table exists. Columns:", Object.keys(nicheData[0] || {}));
  
  const { data: subData, error: err2 } = await supabase.from('sub_niches').select('*').limit(1);
  if (err2) console.error("Sub Niches error:", err2.message);
  else console.log("Sub Niches table exists. Columns:", Object.keys(subData[0] || {}));
}

runQueries();
