const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rjgtvxwxvqngtuvjhlbw.supabase.co';
const supabaseKey = 'sb_publishable_Re0hZ68q9WX90yXaI7AmuQ_RElrMY8K';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('leads').select('company_name, phone, email, website, external_phone, metadata').not('phone', 'is', null).limit(3);
  if (error) console.error(error);
  else console.log("Leads with phone natively:", data);

  const { data: data2 } = await supabase.from('leads').select('company_name, phone, email, website, external_phone, metadata').limit(3);
  console.log("Random leads:", data2);
}
main();
