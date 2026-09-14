import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  try {
    console.log("=== JAS CONNECT 3.0 SCORING AUDIT ===");

    // 1. Fetch tables
    console.log("\n1. SYSTEM CONFIGURATION");
    const { data: profiles } = await supabase.from('industry_profiles').select('*');
    console.log("Industry Profiles:", profiles || "NO ACCESS");

    const { data: registry } = await supabase.from('signal_registry').select('*');
    console.log("Signal Registry:", registry || "NO ACCESS");

    const { data: weights } = await supabase.from('signal_weights').select('*');
    console.log("Signal Weights:", weights || "NO ACCESS");

    const { data: confRules } = await supabase.from('signal_confidence_rules').select('*');
    console.log("Signal Confidence Rules:", confRules || "NO ACCESS");

    // 2. Fetch opportunities in qualification
    console.log("\n2. OPPORTUNITY SCORING VARIANCE (First 50 Qualification)");
    const { data: opps, error } = await supabase.from('opportunities')
      .select(`
        id, 
        title, 
        account_id,
        opportunity_intelligence(confidence, priority_level, summary, opportunity_signals(*)),
        opportunity_scores(*)
      `)
      .eq('stage', 'qualification')
      .limit(50);
      
    if (error) {
      console.error("Error fetching opps:", error.message);
      return;
    }

    if (!opps || opps.length === 0) {
      console.log("No opportunities found in qualification stage.");
      return;
    }

    let minProb = 100, maxProb = 0, sumProb = 0, validOpps = 0;
    
    // Process and display
    opps.forEach((opp, i) => {
      const intel = opp.opportunity_intelligence?.[0] || opp.opportunity_intelligence || {};
      const scores = opp.opportunity_scores?.[0] || opp.opportunity_scores || {};
      
      const sigCount = intel.opportunity_signals?.[0]?.count || intel.opportunity_signals?.length || 0;
      const orderProb = Number(scores.order_probability || 0);
      const procProb = Number(scores.procurement_probability || 0);
      const contScore = Number(scores.contactability_score || 0);
      const oppStrength = Number(scores.opportunity_strength || 0);
      const conf = Number(intel.confidence || 0);
      const priority = intel.priority_level || 'N/A';
      
      console.log(`[${i+1}] ${opp.title} | Sigs: ${sigCount} | Proc: ${procProb}% | Cont: ${contScore}% | Strength: ${oppStrength}% | Order Prob: ${orderProb}% | Prio: ${priority} | Conf: ${conf}`);
      
      if (orderProb > 0) {
        if (orderProb < minProb) minProb = orderProb;
        if (orderProb > maxProb) maxProb = orderProb;
        sumProb += orderProb;
        validOpps++;
      }
    });

    console.log("\n=== SCORE DISTRIBUTION ===");
    console.log(`MIN Probability: ${minProb}%`);
    console.log(`MAX Probability: ${maxProb}%`);
    console.log(`AVERAGE Probability: ${validOpps > 0 ? (sumProb / validOpps).toFixed(2) : 0}%`);

  } catch (err) {
    console.error("Audit failed:", err);
  }
}

runAudit();
