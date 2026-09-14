import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export function Timeline({ leadId }: { leadId?: string }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!leadId) return;
    
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('system_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (data) setEvents(data);
    };

    fetchEvents();

    const channel = supabase.channel('system_events_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_events', filter: `lead_id=eq.${leadId}` }, (payload) => {
        setEvents(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  if (!leadId) return null;

  return (
    <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
      {events.length === 0 && (
        <div className="text-sm text-muted-foreground italic">No events recorded yet.</div>
      )}
      {events.map((event) => {
        let colorClass = "bg-background border-primary";
        let iconHtml = null;
        let description = "";

        if (event.event_type === 'ScoreCalculated') {
           colorClass = "bg-green-100 border-green-500";
           description = `New Score: ${event.payload?.new_score || 0}`;
        } else if (event.event_type === 'ModuleAttached') {
           colorClass = "bg-blue-100 border-blue-500";
           description = `Module: ${event.payload?.module_type || 'Unknown'}`;
        } else if (event.event_type === 'TaskCreated') {
           colorClass = "bg-yellow-100 border-yellow-500";
           description = `Automated Task Generated`;
        } else {
           description = JSON.stringify(event.payload);
        }

        return (
          <div key={event.id} className="relative">
            <div className={`absolute -left-[31px] border-2 rounded-full w-4 h-4 mt-1 ${colorClass}`}></div>
            <div className="text-sm font-semibold">{event.event_type}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
            <div className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</div>
          </div>
        );
      })}
    </div>
  );
}
