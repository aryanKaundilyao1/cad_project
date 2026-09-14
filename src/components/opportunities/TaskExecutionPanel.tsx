import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, Calendar, AlertCircle, Play, MoreVertical } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TaskExecutionPanelProps {
  opportunityId: string;
}

export const TaskExecutionPanel: React.FC<TaskExecutionPanelProps> = ({ opportunityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!opportunityId
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
      
      // Activity logging is now handled automatically by the trg_log_task_completion DB trigger
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['activities', opportunityId] });
      toast({ title: 'Task Completed' });
    }
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading tasks...</div>;

  const pendingTasks = tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled') || [];

  if (pendingTasks.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-lg">
        <CheckSquare className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-foreground">All caught up!</h3>
        <p className="text-xs text-muted-foreground mt-1">No pending tasks for this opportunity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingTasks.map(task => {
        const isOverdue = task.due_date && isPast(new Date(task.due_date));
        
        return (
          <div key={task.id} className={`p-4 border rounded-lg flex flex-col gap-3 transition-colors hover:bg-muted/10 ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <button 
                  className="mt-0.5 w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-colors flex items-center justify-center shrink-0"
                  onClick={() => completeTaskMutation.mutate(task.id)}
                  disabled={completeTaskMutation.isPending}
                >
                  {completeTaskMutation.isPending && <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                </button>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {task.priority === 'high' || task.priority === 'critical' ? (
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        {task.priority} Priority
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] uppercase bg-slate-100 text-slate-600">
                        {task.priority} Priority
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {task.task_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {task.due_date && (
              <div className={`flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-border/50 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
