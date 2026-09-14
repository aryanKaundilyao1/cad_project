import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityService } from '@/services/ActivityService';
import { 
  Phone, 
  Video, 
  Mail, 
  MessageCircle, 
  FileText, 
  Settings, 
  Zap,
  Activity as ActivityIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ActivityTimelineProps {
  opportunityId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ opportunityId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', opportunityId],
    queryFn: () => ActivityService.getOpportunityActivities(opportunityId),
    enabled: !!opportunityId
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4 text-blue-500" />;
      case 'meeting': return <Video className="w-4 h-4 text-indigo-500" />;
      case 'email': return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'note': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'system': return <Settings className="w-4 h-4 text-slate-500" />;
      case 'signal': return <Zap className="w-4 h-4 text-orange-500" />;
      default: return <ActivityIcon className="w-4 h-4 text-primary" />;
    }
  };

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading activity...</div>;
  
  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <ActivityIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-foreground">No Activity Yet</h3>
        <p className="text-xs text-muted-foreground mt-1">Actions and events will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-muted ml-4 space-y-6 pb-4">
      {activities.map((activity: any, index: number) => (
        <div key={activity.id} className="relative pl-6">
          <div className="absolute -left-[11px] top-1 bg-background border-2 border-muted p-1 rounded-full shadow-sm">
            {getIcon(activity.activity_type)}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.activity_timestamp), { addSuffix: true })}
              </span>
            </div>
            
            {activity.description && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md mt-1">
                {activity.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] capitalize bg-background">
                {activity.activity_type}
              </Badge>
              {activity.profiles && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  by {activity.profiles.first_name} {activity.profiles.last_name}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
