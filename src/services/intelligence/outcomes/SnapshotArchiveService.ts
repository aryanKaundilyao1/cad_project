import { supabase } from '../../../integrations/supabase/client';

export class SnapshotArchiveService {
    /**
     * Freezes the current state of an opportunity score and saves it to the archive.
     * This is critical to prevent target leakage in future ML models.
     */
    static async archiveCurrentScore(companyId: string, productId: string, opportunityId: string) {
        try {
            // 1. Fetch current live score
            const { data: currentScore, error: scoreErr } = await supabase
                .from('opportunity_scores')
                .select('*')
                .eq('company_id', companyId)
                .eq('product_id', productId)
                .single();

            // If there's no score yet, we can't archive it. 
            // In a real system, we might trigger a recalculation here first.
            if (scoreErr || !currentScore) {
                console.log(`No live score found to archive for company ${companyId}, product ${productId}`);
                return false;
            }

            // 2. Insert into Archive
            const { error: archiveErr } = await supabase
                .from('score_snapshot_archive')
                .insert({
                    company_id: companyId,
                    product_id: productId,
                    opportunity_id: opportunityId,
                    snapshot_timestamp: new Date().toISOString(),
                    opportunity_score: currentScore.final_score,
                    fit_score: currentScore.fit_score,
                    intent_score: currentScore.intent_score,
                    timing_score: currentScore.timing_score,
                    engagement_score: currentScore.engagement_score,
                    score_version: currentScore.score_version,
                    reason_codes: currentScore.reason_codes
                });

            if (archiveErr) throw archiveErr;

            return true;
        } catch (error) {
            console.error('Failed to archive score snapshot:', error);
            return false;
        }
    }

    static async getSnapshots(opportunityId: string) {
        const { data, error } = await supabase
            .from('score_snapshot_archive')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .order('snapshot_timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching snapshots:', error);
            return [];
        }
        return data;
    }
}
