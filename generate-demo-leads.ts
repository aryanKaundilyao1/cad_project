import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(1);

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const companySuffixes = ['Inc.', 'LLC', 'Group', 'Solutions', 'Global', 'Enterprises'];
const industries = ['Retail', 'Healthcare', 'Manufacturing', 'Technology', 'Construction', 'Wholesale'];

const categories = ['health food store', 'vitamin', 'supplement', 'ayurvedic', 'retail', 'distributor', 'wholesaler', 'pharmacy', 'fitness'];

async function run() {
  const { data: users, error: userError } = await supabase.from('profiles').select('id').limit(1);
  if (userError || !users || users.length === 0) {
    console.error("No users found to assign leads to.");
    return;
  }
  
  const sellerId = users[0].id;
  console.log(`Using seller ID: ${sellerId}`);

  // Fetch a client id from jas_companies
  const { data: companies, error: compError } = await supabase.from('jas_companies').select('id').limit(1);
  let clientId = null;
  if (!compError && companies && companies.length > 0) {
      clientId = companies[0].id;
  } else {
      console.log("No jas_companies found. Attempting to insert one.");
      const { data: newComp, error: newCompErr } = await supabase.from('jas_companies').insert([{
         name: "Demo Company"
      }]).select('id');
      if (!newCompErr && newComp) clientId = newComp[0].id;
  }
  
  if (!clientId) {
      console.error("Failed to get or create a jas_company for client_id");
      return;
  }

  const leadsToInsert = [];
  
  for (let i = 0; i < 150; i++) {
    const fName = randomChoice(firstNames);
    const lName = randomChoice(lastNames);
    const cName = `${lName} ${randomChoice(companySuffixes)}`;
    const category = randomChoice(categories);
    const ind = randomChoice(industries);
    
    // Vary the completeness of the data
    const hasWebsite = Math.random() > 0.3;
    const hasPhone = Math.random() > 0.1;
    const hasEmail = Math.random() > 0.4;
    
    // Vary rating and reviews
    const hasReviews = Math.random() > 0.2;
    const reviews = hasReviews ? randomInt(1, 2000) : 0;
    const rating = hasReviews ? parseFloat(randomFloat(2.0, 5.0)) : null;

    leadsToInsert.push({
      client_id: clientId,
      seller_id: sellerId,
      company_name: cName,
      title: cName,
      contact_name: `${fName} ${lName}`,
      email: hasEmail ? `${fName.toLowerCase()}.${lName.toLowerCase()}@${cName.replace(/[^a-zA-Z]/g, '').toLowerCase()}.com` : null,
      phone: hasPhone ? `+1${randomInt(200,999)}${randomInt(1000000,9999999)}` : null,
      website: hasWebsite ? `https://www.${cName.replace(/[^a-zA-Z]/g, '').toLowerCase()}.com` : null,
      industry: ind,
      main_category: category,
      categories: [category],
      rating: rating,
      reviews: reviews,
      location: 'New York, NY',
      metadata: {
        company_name: cName,
        rating: rating,
        reviews: reviews,
        main_category: category,
        claimed: Math.random() > 0.5,
        address: '123 Fake Street, New York, NY',
        phone: hasPhone ? `+1${randomInt(200,999)}${randomInt(1000000,9999999)}` : null,
        website: hasWebsite ? `https://www.${cName.replace(/[^a-zA-Z]/g, '').toLowerCase()}.com` : null,
      }
    });
  }

  console.log(`Inserting 150 demo leads...`);
  
  // Insert in batches of 50
  for (let i = 0; i < leadsToInsert.length; i += 50) {
    const batch = leadsToInsert.slice(i, i + 50);
    const { error: insertError, data: insertedLeads } = await supabase.from('leads').insert(batch).select('id');
    
    if (insertError) {
      console.error("Error inserting batch:", insertError);
    } else {
      console.log(`Inserted batch ${i/50 + 1}/3... triggering scoring for ${insertedLeads.length} leads`);
      
      // Call the edge function directly
      const leadIds = insertedLeads.map(l => l.id);
      
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/run-client-scoring`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ lead_ids: leadIds })
        });
        
        if (!response.ok) {
           console.error("Scoring failed:", await response.text());
        } else {
           console.log("Scoring succeeded:", await response.json());
        }
      } catch (err) {
        console.error("Failed to invoke edge function:", err);
      }
    }
  }

  console.log("Done generating demo leads.");
}

run();
