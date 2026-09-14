import { supabase } from '../../../integrations/supabase/client';
import { SnapshotArchiveService } from './SnapshotArchiveService';

export type OutcomeType = 'WON' | 'LOST' | 'COMPETITOR_WON' | 'DELAYED' | 'NO_DECISION' | 'DISQUALIFIED' | 'CANCELLED' | 'IN_PROGRESS';

export interface OutcomeRecord {
    id: string;
    company_id: string;
    product_id: string;
    opportunity_id: string;
    current_status: string;
    outcome_type?: OutcomeType;
    created_at: string;
    updated_at: string;
    closed_at?: string;
    notes?: string;
}

export class OutcomeTrackingService {
    /**
     * Initializes a new opportunity outcome record.
     * Takes a snapshot of the current OpportunityScore immediately.
     */
    static async createOpportunityOutcome(companyId: string, productId: string, opportunityId: string, initialStatus: string = 'Lead', notes?: string) {
        // 1. Create the outcome record
        const { data: outcome, error: outcomeError } = await supabase
            .from('crm_outcomes')
            .insert({
                company_id: companyId,
                product_id: productId,
                opportunity_id: opportunityId,
                current_status: initialStatus,
                outcome_type: 'IN_PROGRESS',
                notes
            })
            .select()
            .single();

        if (outcomeError) throw outcomeError;

        // 2. Create initial history log
        await this.logHistory(opportunityId, null, initialStatus, 'Initial Creation', notes);

        // 3. Create the crucial first snapshot
        await SnapshotArchiveService.archiveCurrentScore(companyId, productId, opportunityId);

        return outcome;
    }

    /**
     * Updates an opportunity's status and potentially its final outcome.
     * Triggers a snapshot if it's a significant stage change.
     */
    static async updateOpportunityStatus(opportunityId: string, newStatus: string, outcomeType: OutcomeType = 'IN_PROGRESS', reason?: string, notes?: string) {
        // 1. Fetch current status
        const { data: current, error: fetchErr } = await supabase
            .from('crm_outcomes')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .single();

        if (fetchErr) throw fetchErr;
        if (!current) throw new Error('Opportunity not found in tracking system.');

        const previousStatus = current.current_status;

        // 2. Update Outcome
        const updatePayload: any = {
            current_status: newStatus,
            outcome_type: outcomeType,
            updated_at: new Date().toISOString()
        };

        // If it's a terminal state, set closed_at
        if (outcomeType !== 'IN_PROGRESS') {
            updatePayload.closed_at = new Date().toISOString();
        }

        const { error: updateErr } = await supabase
            .from('crm_outcomes')
            .update(updatePayload)
            .eq('opportunity_id', opportunityId);

        if (updateErr) throw updateErr;

        // 3. Log History
        await this.logHistory(opportunityId, previousStatus, newStatus, reason || 'Status Transition', notes);

        // 4. Archive a new snapshot to freeze the state at this stage transition
        await SnapshotArchiveService.archiveCurrentScore(current.company_id, current.product_id, opportunityId);

        return true;
    }

    private static async logHistory(opportunityId: string, previousStatus: string | null, newStatus: string, reason: string, notes?: string) {
        await supabase
            .from('outcome_history')
            .insert({
                opportunity_id: opportunityId,
                previous_status: previousStatus,
                new_status: newStatus,
                change_reason: reason,
                notes: notes
            });
    }

    static async getOutcomes() {
        const { data, error } = await supabase.from('crm_outcomes').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error(error);
            return [];
        }
        return data;
    }

    static async getOutcomeHistory(opportunityId: string) {
        const { data, error } = await supabase.from('outcome_history').select('*').eq('opportunity_id', opportunityId).order('changed_at', { ascending: true });
        if (error) {
            console.error(error);
            return [];
        }
        return data;
    }
}
