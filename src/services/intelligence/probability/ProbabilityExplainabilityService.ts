import { supabase } from '../../../integrations/supabase/client';
import { ColdStartProbabilityService } from './ColdStartProbabilityService';
import { ProbabilityWindowService } from './ProbabilityWindowService';
import { ProbabilityDriverService } from './ProbabilityDriverService';

export class ProbabilityExplainabilityService {
    /**
     * End-to-end function that takes an Opportunity Score, calculates all probability metrics,
     * stores them in the database, and returns the fully explainable payload.
     */
    static async generateAndStoreProbability(companyId: string, productId: string) {
        // 1. Fetch current Opportunity Score
        const { data: score, error: scoreErr } = await supabase
            .from('opportunity_scores')
            .select('*')
            .eq('company_id', companyId)
            .eq('product_id', productId)
            .single();
            
        if (scoreErr || !score) throw new Error('No opportunity score found.');

        // 2. Calculate Base Probability (Cold Start Interpolation)
        const baseProb = ColdStartProbabilityService.calculateProbability(score.final_score);

        // 3. Calculate Window Distributions
        const windows = ProbabilityWindowService.calculateWindowDistribution(baseProb, score.timing_score);

        // 4. Extract Drivers & Reason Codes
        const drivers = ProbabilityDriverService.extractDrivers(
            score.fit_score, score.intent_score, score.timing_score, score.engagement_score
        );

        // 5. Store / Update in purchase_probabilities
        const payload = {
            company_id: companyId,
            product_id: productId,
            opportunity_score: score.final_score,
            purchase_probability: baseProb,
            probability_30_day: windows.prob30Day,
            probability_90_day: windows.prob90Day,
            probability_180_day: windows.prob180Day,
            probability_source: 'cold_start',
            probability_version: 'v1.0',
            recommended_window: windows.recommendedWindow,
            updated_at: new Date().toISOString()
        };

        const { data: savedProb, error: saveErr } = await supabase
            .from('purchase_probabilities')
            .upsert(payload, { onConflict: 'company_id,product_id' })
            .select()
            .single();

        if (saveErr) throw saveErr;

        // 6. Log to History
        await supabase.from('probability_history').insert({
            company_id: companyId,
            product_id: productId,
            purchase_probability: baseProb,
            opportunity_score: score.final_score,
            probability_version: 'v1.0'
        });

        // 7. Store Drivers
        if (savedProb) {
            // Delete old drivers
            await supabase.from('probability_drivers').delete().eq('probability_id', savedProb.id);
            // Insert new
            const driverInserts = drivers.map(d => ({
                probability_id: savedProb.id,
                driver_name: d.driver_name,
                driver_type: d.driver_type,
                driver_contribution: d.driver_contribution
            }));
            if (driverInserts.length > 0) {
                 await supabase.from('probability_drivers').insert(driverInserts);
            }
        }

        // Return explainable payload
        return {
            purchase_probability: baseProb,
            windows,
            drivers,
            opportunity_score: score.final_score
        };
    }
}
