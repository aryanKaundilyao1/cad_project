require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Seeding Trial Premium Client...');

  const email = 'trial1@jasconnectt.in';
  const password = '9811277719';

  // 1. Check if user exists, if not, create them via auth admin
  let user_id = null;
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    console.log('User already exists:', email);
    user_id = existingUser.id;
  } else {
    console.log('Creating new auth user:', email);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    user_id = newUser.user.id;
  }

  // 2. Create the Company Profile
  console.log('Creating Company Profile...');
  
  const companyData = {
    email,
    company_name: 'Trial Client Exports Ltd',
    industry: 'Exports',
    business_description: 'We export premium goods globally including Ayurvedic medicines and textiles.',
    account_type: 'premium',
    verification_status: 'verified',
    city: 'New Delhi',
    country: 'India',
    owner_name: 'Trial Client'
  };

  let company;
  const { data: existingCompany } = await supabase.from('jas_companies').select('*').eq('email', email).maybeSingle();
  
  if (existingCompany) {
    const { data: updatedCompany, error: companyError } = await supabase.from('jas_companies').update(companyData).eq('id', existingCompany.id).select().single();
    if (companyError) {
      console.error('Error updating company:', companyError.message);
      return;
    }
    company = updatedCompany;
  } else {
    const { data: newCompany, error: companyError } = await supabase.from('jas_companies').insert(companyData).select().single();
    if (companyError) {
      console.error('Error creating company:', companyError.message);
      return;
    }
    company = newCompany;
  }

  // 3. Create Categories
  console.log('Creating Categories...');
  const cats = ['Ayurveda', 'Rice', 'Carpets', 'Blankets', 'Homeopathy'];
  const catIds = {};
  
  for (const c of cats) {
    const { data: existingCat } = await supabase.from('client_business_categories')
      .select('id').eq('company_id', company.id).eq('name', c).maybeSingle();
      
    if (existingCat) {
      catIds[c] = existingCat.id;
    } else {
      const { data: newCat, error: catError } = await supabase.from('client_business_categories')
        .insert({ company_id: company.id, name: c }).select().single();
      if (catError) {
        console.error('Error creating category:', catError.message);
      } else {
        catIds[c] = newCat.id;
      }
    }
  }

  // 4. Create Products
  console.log('Creating Products...');
  const productsToSeed = [
    { name: 'Ashwagandha Root Extract', category: 'Ayurveda', business_category_id: catIds['Ayurveda'], description: 'Premium quality Ashwagandha root.', price: 45.00, currency: 'USD', moq: '500 kg', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Brahmi Powder', category: 'Ayurveda', business_category_id: catIds['Ayurveda'], description: 'Organic Brahmi leaf powder.', price: 30.00, currency: 'USD', moq: '200 kg', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Turmeric Fingers', category: 'Agriculture', business_category_id: catIds['Ayurveda'], description: 'High curcumin Turmeric fingers.', price: 15.50, currency: 'USD', moq: '1000 kg', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Basmati Rice', category: 'Agriculture', business_category_id: catIds['Rice'], description: 'Premium long grain Basmati Rice.', price: 1.50, currency: 'USD', moq: '5000 kg', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Handwoven Carpets', category: 'Textiles', business_category_id: catIds['Carpets'], description: 'Luxury handwoven traditional carpets.', price: 250.00, currency: 'USD', moq: '50 units', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Woolen Blankets', category: 'Textiles', business_category_id: catIds['Blankets'], description: 'Premium winter woolen blankets.', price: 45.00, currency: 'USD', moq: '200 units', manufacturer_id: company.id, visibility_status: 'visible' },
    { name: 'Arnica Montana 30CH', category: 'Healthcare', business_category_id: catIds['Homeopathy'], description: 'Homeopathic remedy for bruises and muscle soreness.', price: 5.00, currency: 'USD', moq: '1000 units', manufacturer_id: company.id, visibility_status: 'visible' }
  ];

  for (const prod of productsToSeed) {
    if (!prod.business_category_id) continue;
    
    const { data: existingProd } = await supabase.from('products').select('id').eq('name', prod.name).eq('manufacturer_id', company.id).maybeSingle();
    
    if (existingProd) {
      const { error: prodError } = await supabase.from('products').update(prod).eq('id', existingProd.id);
      if (prodError) {
        console.log(`Failed to update product ${prod.name}:`, prodError.message);
      } else {
        console.log(`Product updated: ${prod.name}`);
      }
    } else {
      const { error: prodError } = await supabase.from('products').insert(prod);
      if (prodError) {
        console.log(`Failed to insert product ${prod.name}:`, prodError.message);
      } else {
        console.log(`Product created: ${prod.name}`);
      }
    }
  }

  console.log('Seeding complete! You can login with:');
  console.log('Email:', email);
  console.log('Password:', password);
}

run();
