import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/aryankaundilya/Downloads/jas connect/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: opps } = await supabase.from('opportunities').select('id, order_probability, confidence_overall, procurement_probability, contactability_score');
  
  let qualifiedCount = 0;
  let nonQualifiedCount = 0;
  const nonQualifiedOpps = [];

  for (const opp of opps) {
    const isQualified = (opp.order_probability || 0) >= 50.0 && (opp.confidence_overall || 0) >= 50.0;
    if (isQualified) {
      qualifiedCount++;
    } else {
      nonQualifiedCount++;
      if (nonQualifiedOpps.length < 20) {
        nonQualifiedOpps.push(opp);
      }
    }
  }

  console.log(`Qualified Count: ${qualifiedCount}`);
  console.log(`Non-Qualified Count: ${nonQualifiedCount}`);
  console.log("\nNon-Qualified Opportunities:");
  for (const opp of nonQualifiedOpps) {
    console.log(`- ID: ${opp.id}`);
    console.log(`  Confidence: ${opp.confidence_overall}`);
    console.log(`  Procurement: ${opp.procurement_probability}`);
    console.log(`  Contactability: ${opp.contactability_score}`);
    console.log(`  Order Probability: ${opp.order_probability}`);
  }
}

run();
