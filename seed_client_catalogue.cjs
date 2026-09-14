require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const clientEmail = 'trial1@jasconnectt.in';
  
  // 1. Get company ID
  const { data: company, error: companyErr } = await supabase
    .from('jas_companies')
    .select('id, company_name')
    .eq('email', clientEmail)
    .single();
    
  if (companyErr || !company) {
    console.error('Failed to find company:', companyErr);
    process.exit(1);
  }
  
  console.log(`Found company: ${company.company_name} (${company.id})`);

  // 2. Update company visibility
  const { error: updateErr } = await supabase
    .from('jas_companies')
    .update({
      public_visibility: true,
      marketplace_listing_enabled: true,
      company_status: 'Active',
      verification_status: 'Verified'
    })
    .eq('id', company.id);
    
  if (updateErr) {
    console.error('Failed to update company visibility:', updateErr);
  } else {
    console.log('Company marketplace visibility enabled.');
  }

  // 3. Define the products
  const productsToSeed = [
    {
      name: 'Premium Basmati Rice',
      description: 'High-quality, long-grain basmati rice sourced from the best farms. Perfect for export and bulk distribution.',
      category: 'Agriculture & Farming',
      pricing: 1.50
    },
    {
      name: 'Handwoven Persian Carpets & Blankets',
      description: 'Authentic handwoven carpets and thermal blankets made with premium wool and sustainable materials.',
      category: 'Textiles & Apparel',
      pricing: 250.00
    },
    {
      name: 'Ashwagandha Extract (Stress Reduction)',
      description: 'Pure, organic Ashwagandha root extract tailored for stress reduction, cognitive support, and vitality. Certified for global medical standards.',
      category: 'Healthcare & Pharmaceuticals',
      pricing: 45.00
    },
    {
      name: 'Brahmi Powder (Cognitive Support)',
      description: 'Ayurvedic Brahmi powder designed for cognitive support, memory enhancement, and overall neurological wellness.',
      category: 'Healthcare & Pharmaceuticals',
      pricing: 30.00
    },
    {
      name: 'Turmeric Curcumin (Anti-inflammatory)',
      description: 'High-potency Turmeric Curcumin supplement with black pepper extract for optimal absorption and anti-inflammatory benefits.',
      category: 'Healthcare & Pharmaceuticals',
      pricing: 25.00
    }
  ];

  for (const prod of productsToSeed) {
    // Check if product exists
    const { data: existing } = await supabase
      .from('jas_products')
      .select('product_id')
      .eq('company_id', company.id)
      .eq('name', prod.name)
      .maybeSingle();

    if (existing) {
      console.log(`Product already exists: ${prod.name}`);
      continue;
    }

    // Insert Product
    const { data: insertedProd, error: insertErr } = await supabase
      .from('jas_products')
      .insert({
        company_id: company.id,
        name: prod.name,
        description: prod.description,
        category: prod.category
      })
      .select('product_id')
      .single();

    if (insertErr) {
      console.error(`Failed to insert product ${prod.name}:`, insertErr);
      continue;
    }

    // Insert Pricing
    await supabase.from('jas_product_pricing').insert({
      product_id: insertedProd.product_id,
      price: prod.pricing,
      price_type: 'negotiable'
    });
    
    console.log(`Inserted product: ${prod.name}`);
  }
  
  console.log('Seed completed successfully.');
}

seed();
