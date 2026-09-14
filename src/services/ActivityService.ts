import { supabase } from '@/integrations/supabase/client';

export class ActivityService {
  /**
   * Log an activity on an opportunity
   */
  static async logActivity(
    workspaceId: string,
    opportunityId: string,
    userId: string,
    type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'note' | 'system' | 'signal',
    title: string,
    description: string = '',
    metadata: Record<string, any> = {}
  ) {
    try {
      const { data, error } = await supabase.from('activities').insert({
        workspace_id: workspaceId,
        opportunity_id: opportunityId,
        created_by: userId,
        activity_type: type,
        title: title,
        description: description,
        metadata: metadata
      }).select().single();

      if (error) throw error;
      return { success: true, activity: data };
    } catch (err) {
      console.error('Failed to log activity:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Fetch activities for an opportunity
   */
  static async getOpportunityActivities(opportunityId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('opportunity_id', opportunityId)
      .order('activity_timestamp', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }
}
