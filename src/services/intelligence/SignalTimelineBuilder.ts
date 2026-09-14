import { SignalService, SignalEvent } from "../SignalService";

export interface TimelineGroup {
  date: string;
  events: SignalEvent[];
}

export class SignalTimelineBuilder {
  
  static async buildCompanyTimeline(companyId: string): Promise<TimelineGroup[]> {
    const events = await SignalService.getCompanySignalTimeline(companyId);
    
    // Group events by date (YYYY-MM-DD)
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, SignalEvent[]>);

    // Convert to array and sort by date descending
    return Object.entries(grouped)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async getAllSignalsFiltered(filters: any) {
    let query = SignalService.getBaseQuery('signal_event_store')
      .select('*, signal_definitions(*), companies(*)');
      
    if (filters.industry) {
      // Need a join filter, Supabase handles this via embedded resource filtering
      query = query.eq('companies.industry', filters.industry);
    }
    if (filters.category) {
      query = query.eq('signal_definitions.category', filters.category);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    
    // Filter out nulls from inner joins if using strict eq
    return data.filter((d: any) => d.companies && d.signal_definitions);
  }
}
