const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_ANON_KEY || 'eyJh...');
async function run() {
  // get column names from leads
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
run();
