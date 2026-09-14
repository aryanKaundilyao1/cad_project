import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { scoreLead } from './src/scoring/pipeline';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfill() {
  console.log('Starting OIE backfill for existing opportunities...');

  // 1. Fetch opportunities that are missing a lead_score
  const { data: opps, error: oppErr } = await supabase
    .from('opportunities')
    .select('id, workspace_id, legacy_lead_id, lead_score');

  if (oppErr) {
    console.error('Failed to fetch opportunities:', oppErr);
    return;
  }

  console.log(`Found ${opps?.length || 0} opportunities to backfill.`);

  if (!opps || opps.length === 0) return;

  for (const opp of opps) {
    if (!opp.legacy_lead_id) {
      console.log(`Skipping opp ${opp.id} - no legacy_lead_id`);
      continue;
    }

    // 2. Fetch raw lead
    const { data: leadData, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', opp.legacy_lead_id)
      .single();

    if (leadErr || !leadData) {
      console.log(`Could not find lead for opp ${opp.id}`);
      continue;
    }

    // 3. Score
    const result = scoreLead(leadData as any);
    console.log(`Scored lead ${leadData.company_name} -> ${result.lead_score}`);

    // 4. Save to user_lead_scores
    const scoreData = {
      user_id: opp.workspace_id,
      lead_id: result.lead_id,
      score_version: 'OIE_1.0',
      lead_score: result.lead_score,
      proc_score: result.proc_score,
      cont_score: result.cont_score,
      conf_score: result.conf_score,
      fit_score: result.fit_score,
      qual_score: result.qual_score,
      risk_score: result.risk_score,
      opp_score: result.opp_score,
      explanation: result.explanation,
      evidence_used: result.evidence_used,
      missing_evidence: [] as string[],
      updated_at: new Date().toISOString()
    };

    const missingEvidenceSet = new Set<string>();
    if (result.score_breakdown) {
      Object.values(result.score_breakdown).forEach((metric: any) => {
        if (metric && metric.missing_evidence) {
          metric.missing_evidence.forEach((e: string) => missingEvidenceSet.add(e));
        }
      });
    }
    scoreData.missing_evidence = Array.from(missingEvidenceSet);

    // If the table doesn't exist yet because the migration wasn't run, this will fail.
    // Let's catch it so we still update the opportunity.
    const { error: upsertErr } = await supabase
      .from('user_lead_scores')
      .upsert(scoreData, { onConflict: 'user_id, lead_id, score_version' });

    if (upsertErr) {
      console.error(`Failed to save user score for ${result.lead_id}:`, upsertErr.message);
    }

    // 5. Update opportunity
    const { error: updateErr } = await supabase
      .from('opportunities')
      .update({ lead_score: result.lead_score })
      .eq('id', opp.id);

    if (updateErr) {
      console.error(`Failed to update opportunity ${opp.id}:`, updateErr.message);
    }
  }

  console.log('Backfill complete!');
}

backfill().catch(console.error);
