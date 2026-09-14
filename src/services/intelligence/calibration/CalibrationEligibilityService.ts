import { supabase } from '../../../integrations/supabase/client';

export class CalibrationEligibilityService {
    /**
     * Checks if we have enough historical terminal outcomes to run statistical calibration.
     * Defaults to 200 required outcomes.
     */
    static async isEligibleForCalibration(threshold: number = 200): Promise<{ eligible: boolean, count: number }> {
        // Mock query - in production this counts terminal records in crm_outcomes
        const { count, error } = await supabase
            .from('crm_outcomes')
            .select('*', { count: 'exact', head: true })
            .in('outcome_type', ['WON', 'LOST', 'COMPETITOR_WON']);

        const actualCount = count || 0;
        return {
            eligible: actualCount >= threshold,
            count: actualCount
        };
    }
}
