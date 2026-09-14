import { supabase } from '../../../integrations/supabase/client';

export interface TrainingRecord {
    opportunity_id: string;
    company_id: string;
    product_id: string;
    snapshot_timestamp: string;
    opportunity_score: number;
    fit_score: number;
    intent_score: number;
    timing_score: number;
    engagement_score: number;
    final_outcome: string; // e.g., 'WON', 'LOST'
    days_to_close: number;
}

export class TrainingDatasetBuilder {
    /**
     * Builds the flat dataset required for ML training.
     * Joins the closed outcomes with their initial snapshots.
     */
    static async generateTrainingDataset(): Promise<TrainingRecord[]> {
        // In a production environment, this would likely be a complex SQL View
        // or handled via a data warehouse. For Phase 5A, we simulate the join in code.

        // 1. Get all closed outcomes
        const { data: outcomes, error: outErr } = await supabase
            .from('crm_outcomes')
            .select('*')
            .in('outcome_type', ['WON', 'LOST', 'COMPETITOR_WON']);

        if (outErr) {
            console.error('Error fetching outcomes for training dataset:', outErr);
            return [];
        }

        const records: TrainingRecord[] = [];

        // 2. For each closed outcome, find its EARLIEST snapshot
        for (const outcome of outcomes) {
            const { data: snapshots, error: snapErr } = await supabase
                .from('score_snapshot_archive')
                .select('*')
                .eq('opportunity_id', outcome.opportunity_id)
                .order('snapshot_timestamp', { ascending: true }) // Earliest first
                .limit(1);

            if (snapErr || !snapshots || snapshots.length === 0) continue;

            const snapshot = snapshots[0];

            // Calculate days to close
            const created = new Date(outcome.created_at);
            const closed = new Date(outcome.closed_at || outcome.updated_at);
            const daysToClose = Math.round((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

            records.push({
                opportunity_id: outcome.opportunity_id,
                company_id: outcome.company_id,
                product_id: outcome.product_id,
                snapshot_timestamp: snapshot.snapshot_timestamp,
                opportunity_score: snapshot.opportunity_score,
                fit_score: snapshot.fit_score,
                intent_score: snapshot.intent_score,
                timing_score: snapshot.timing_score,
                engagement_score: snapshot.engagement_score,
                final_outcome: outcome.outcome_type,
                days_to_close: daysToClose
            });
        }

        return records;
    }
}
