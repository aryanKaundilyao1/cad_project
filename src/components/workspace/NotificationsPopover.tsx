import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    const channel = supabase.channel('notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <Popover onOpenChange={(open) => open && markAsRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border bg-muted/50">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">No new notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${!n.is_read ? 'bg-muted/10' : ''}`}>
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.description}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
