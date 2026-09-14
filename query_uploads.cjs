const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rjgtvxwxvqngtuvjhlbw.supabase.co';
const supabaseKey = 'sb_publishable_Re0hZ68q9WX90yXaI7AmuQ_RElrMY8K';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('upload_rows').select('raw_data').limit(5);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
main();
