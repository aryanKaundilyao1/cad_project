import { supabase } from '@/integrations/supabase/client';
import { IntelligenceSnapshot, TimelineEvent } from '@/types/domain';

export const intelligenceService = {
  getOpportunityIntelligence: async (opportunityId: string): Promise<IntelligenceSnapshot | null> => {
    const { data, error } = await supabase
      .from('v_opportunity_intelligence')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found
    return data as IntelligenceSnapshot | null;
  }
};

export const timelineService = {
  // In a real app, this might call an RPC or fetch activities/tasks concurrently and merge them.
  getOpportunityTimeline: async (opportunityId: string): Promise<TimelineEvent[]> => {
    // Placeholder fetching logic until RPC is fully built
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('activity_timestamp', { ascending: false });

    if (actError) throw actError;

    // Map DB activities to the uniform TimelineEvent contract
    return (activities || []).map(a => ({
      event_id: a.id,
      event_type: 'activity',
      icon: a.activity_type,
      title: a.title,
      description: a.description || '',
      timestamp: a.activity_timestamp,
      actor_name: 'System', // Would join on users table
      metadata: a.metadata,
    }));
  }
};
