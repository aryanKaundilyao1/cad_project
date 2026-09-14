require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("Starting Phase 4A Fit Scoring Test...");

  try {
    // 1. Create a dummy product
    const { data: product, error: err1 } = await supabase
      .from('products')
      .insert({ name: 'Alpha Warehouse Package', category: 'Construction' })
      .select().single();
    if (err1) throw err1;
    console.log(`✓ Created Product: ${product.name} (${product.id})`);

    // 2. Create a dummy company (ABC Warehousing Pvt Ltd)
    const { data: company, error: err2 } = await supabase
      .from('companies')
      .insert({ 
        name: 'ABC Warehousing Pvt Ltd', 
        industry: 'Logistics',
        revenue: '50M-100M',
        employees: '500-1000',
        location: 'Mumbai, India'
      })
      .select().single();
    if (err2) throw err2;
    console.log(`✓ Created Company: ${company.name} (${company.id})`);

    // 3. Add enrichments for tech stack and financials
    await supabase.from('company_enrichments').insert([
      { company_id: company.id, provider_type: 'technographics', raw_data: [{ name: 'SAP' }, { name: 'AWS' }] },
      { company_id: company.id, provider_type: 'financials', raw_data: { status: 'healthy', credit_score: 750 } }
    ]);
    console.log(`✓ Added Firmographic Enrichments`);

    console.log("Note: To fully run the FitScoreService, you must run it from the React app since it uses ES Modules and path aliases.");
    console.log(`Use the UI at /admin/scoring/fit to calculate the score for ${company.name} and ${product.name}`);
    console.log(`Test setup complete. Do not forget to delete test data when done.`);

  } catch (err) {
    console.error("❌ Test setup failed:", err);
  }
}

runTest();
