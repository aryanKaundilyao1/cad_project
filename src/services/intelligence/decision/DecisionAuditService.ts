import { supabase } from '@/integrations/supabase/client';
import { DecisionAuditLog } from '@/types/decision-intelligence';

export class DecisionAuditService {
    /**
     * Logs an audit event for any Decision Intelligence entity.
     */
    static async logEvent(
        entityType: 'playbook' | 'action' | 'recommendation' | 'version',
        entityId: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        oldValue?: any,
        newValue?: any,
        reason?: string,
        userId?: string
    ): Promise<void> {
        try {
            const { error } = await supabase
                .from('decision_audit_logs')
                .insert({
                    entity_type: entityType,
                    entity_id: entityId,
                    action,
                    old_value: oldValue || null,
                    new_value: newValue || null,
                    reason: reason || null,
                    user_id: userId || null
                });

            if (error) throw error;
        } catch (err) {
            console.error(`Failed to write audit log for ${entityType} ${entityId}`, err);
            // In a strict production system, failure to write an audit log should potentially fail the transaction.
            // For now we log it.
        }
    }

    /**
     * Retrieves audit logs with pagination and filtering.
     */
    static async getLogs(options?: {
        entityType?: string;
        entityId?: string;
        action?: string;
        page?: number;
        limit?: number;
    }) {
        let query = supabase
            .from('decision_audit_logs')
            .select('*', { count: 'exact' });

        if (options?.entityType) query = query.eq('entity_type', options.entityType);
        if (options?.entityId) query = query.eq('entity_id', options.entityId);
        if (options?.action) query = query.eq('action', options.action);

        if (options?.page && options?.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }

        query = query.order('timestamp', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as DecisionAuditLog[], count };
    }
}
