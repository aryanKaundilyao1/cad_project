import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Get Trial Client company
  const { data: company, error: companyErr } = await supabase
    .from('jas_companies')
    .select('*')
    .ilike('name', '%Trial%');
    
  console.log('Companies matching "Trial":', company);
  
  if (company && company.length > 0) {
    const { data: products, error: prodErr } = await supabase
      .from('jas_products')
      .select('*')
      .eq('company_id', company[0].id);
      
    console.log(`Products for company ${company[0].id}:`, products?.length || 0);
    console.log(products);
  } else {
    // Check all products
    const { data: allProducts, error: allErr } = await supabase
      .from('jas_products')
      .select('*');
    console.log('All products:', allProducts?.length);
    console.log(allProducts);
  }
}

check();
