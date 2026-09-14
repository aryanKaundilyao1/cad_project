import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjgtvxwxvqngtuvjhlbw.supabase.co';
const supabaseKey = 'sb_publishable_Re0hZ68q9WX90yXaI7AmuQ_RElrMY8K';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking all opportunity stages...");
  const { data: allOpps, error } = await supabase
    .from('opportunities')
    .select('stage, id, title, accounts(name)');

  if (error) {
    console.error("Error fetching opps:", error);
    return;
  }
  
  if (!allOpps || allOpps.length === 0) {
    console.log("No opportunities found AT ALL in database.");
    return;
  }
  
  const stages = [...new Set(allOpps.map(o => o.stage))];
  console.log(`Available stages: ${stages.join(', ')}`);
  
  // Try to find discovery
  const discoveryOpps = allOpps.filter(o => (o.stage || '').toLowerCase() === 'discovery');
  console.log(`Found ${discoveryOpps.length} in discovery.`);

  // If none in discovery, let's just pick the first 3
  const opps = discoveryOpps.length > 0 ? discoveryOpps.slice(0, 3) : allOpps.slice(0, 3);
  console.log(`Using ${opps.length} opportunities for test...`);

  for (const opp of opps) {
    const companyName = opp.accounts?.name || opp.title || 'Unknown';
    console.log(`\n=================================================`);
    console.log(`Company Name: ${companyName}`);
    console.log(`Opportunity Title: ${opp.title}`);
    console.log(`ID: ${opp.id}`);
    
    // Run pipeline
    console.log(`Running pipeline...`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('execute_opportunity_pipeline', {
      opportunity_ids: [opp.id]
    });
    
    if (rpcError) {
      console.error("RPC Error:", rpcError);
      continue;
    }
    
    // Fetch signals
    const { data: oppSignals } = await supabase
      .from('opportunity_signals')
      .select('signal_instance_id')
      .eq('opportunity_id', opp.id);
      
    console.log(`Signal Instances Found: ${oppSignals?.length || 0}`);

    // Fetch scores
    const { data: scores } = await supabase
      .from('opportunity_scores')
      .select('*')
      .eq('opportunity_id', opp.id)
      .single();
      
    if (scores) {
      console.log(`Procurement Probability: ${scores.procurement_probability}%`);
      console.log(`Contactability Score: ${scores.contactability_score}%`);
      console.log(`Order Probability: ${scores.order_probability}%`);
      console.log(`Qualification Result: ${scores.confidence >= 70 ? 'Qualified' : 'Non-Qualified'} (Confidence: ${scores.confidence}%)`);
    } else {
      console.log(`No scores generated!`);
    }

    // Fetch priority
    const { data: priority } = await supabase
      .from('opportunity_priorities')
      .select('*')
      .eq('opportunity_id', opp.id)
      .single();
      
    if (priority) {
      console.log(`Priority: ${priority.priority_level}`);
    } else {
      console.log(`No priority generated!`);
    }
    
    // Fetch final stage
    const { data: updatedOpp } = await supabase
      .from('opportunities')
      .select('stage')
      .eq('id', opp.id)
      .single();
      
    if (updatedOpp) {
      console.log(`Final Stage: ${updatedOpp.stage}`);
    }
  }
}

run();
