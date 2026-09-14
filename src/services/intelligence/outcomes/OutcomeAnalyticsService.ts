import { supabase } from '../../../integrations/supabase/client';

export interface OutcomeAnalytics {
    totalOpportunities: number;
    wonOpportunities: number;
    lostOpportunities: number;
    winRate: number;
    lossRate: number;
    avgScoreWon: number;
    avgScoreLost: number;
}

export class OutcomeAnalyticsService {
    static async getGlobalAnalytics(): Promise<OutcomeAnalytics> {
        const { data: outcomes, error } = await supabase
            .from('crm_outcomes')
            .select(`
                *,
                score_snapshot_archive (
                    opportunity_score
                )
            `);

        if (error || !outcomes) {
            console.error('Failed to calculate outcome analytics', error);
            return {
                totalOpportunities: 0,
                wonOpportunities: 0,
                lostOpportunities: 0,
                winRate: 0,
                lossRate: 0,
                avgScoreWon: 0,
                avgScoreLost: 0
            };
        }

        const total = outcomes.length;
        const won = outcomes.filter(o => o.outcome_type === 'WON');
        const lost = outcomes.filter(o => ['LOST', 'COMPETITOR_WON'].includes(o.outcome_type));

        let wonScoresSum = 0;
        let lostScoresSum = 0;
        let wonWithScoreCount = 0;
        let lostWithScoreCount = 0;

        won.forEach((w: any) => {
             if (w.score_snapshot_archive && w.score_snapshot_archive.length > 0) {
                 wonScoresSum += w.score_snapshot_archive[0].opportunity_score;
                 wonWithScoreCount++;
             }
        });

        lost.forEach((l: any) => {
            if (l.score_snapshot_archive && l.score_snapshot_archive.length > 0) {
                lostScoresSum += l.score_snapshot_archive[0].opportunity_score;
                lostWithScoreCount++;
            }
       });


        return {
            totalOpportunities: total,
            wonOpportunities: won.length,
            lostOpportunities: lost.length,
            winRate: total > 0 ? (won.length / total) * 100 : 0,
            lossRate: total > 0 ? (lost.length / total) * 100 : 0,
            avgScoreWon: wonWithScoreCount > 0 ? wonScoresSum / wonWithScoreCount : 0,
            avgScoreLost: lostWithScoreCount > 0 ? lostScoresSum / lostWithScoreCount : 0
        };
    }
}
