const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  console.log("--- 1. Count leads by industry ---");
  const { data: indCount, error: err1 } = await supabase.from('leads').select('industry_id, industries(name)');
  if(err1) console.error(err1);
  const indMap = {};
  indCount.forEach(r => {
    const name = r.industries?.name || r.industry_id || 'NULL';
    indMap[name] = (indMap[name] || 0) + 1;
  });
  console.log(indMap);

  console.log("--- 2. Count leads by niche ---");
  const { data: nicheCount, error: err2 } = await supabase.from('leads').select('niche');
  const nicheMap = {};
  nicheCount.forEach(r => {
    const name = r.niche || 'NULL';
    nicheMap[name] = (nicheMap[name] || 0) + 1;
  });
  console.log(nicheMap);

  console.log("--- 3. Count leads with NULL industry ---");
  console.log(indCount.filter(r => !r.industry_id).length);

  console.log("--- 4. Count leads with NULL niche ---");
  console.log(nicheCount.filter(r => !r.niche).length);
  
  console.log("--- Test Query: 'warehouse in noida' ---");
  const terms = ['warehouse', 'in', 'noida'];
  let q = supabase.from('leads').select('title, location, industry_id').limit(10);
  terms.forEach(t => {
      q = q.or(`title.ilike.%${t}%,description.ilike.%${t}%,company_name.ilike.%${t}%,location.ilike.%${t}%,city.ilike.%${t}%,state.ilike.%${t}%,industry.ilike.%${t}%,niche.ilike.%${t}%,sub_niche.ilike.%${t}%`);
  });
  const { data: searchRes, error: errSearch } = await q;
  if(errSearch) console.error("Search Error:", errSearch);
  else console.log(searchRes);
}

runQueries();
