import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Target, Zap, Clock, CheckCircle2, ArrowRight, Activity, Calendar, 
  Phone, Mail, CalendarDays, AlertTriangle, CheckSquare, Plus, ChevronRight,
  TrendingUp, Award
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isBefore, startOfDay } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadScoreModal } from "@/components/scoring/LeadScoreModal";

type ActionTab = 'calls' | 'emails' | 'meetings' | 'followups' | 'today' | 'overdue' | 'completed';

export default function ActionCenter() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActionTab>('today');
  const [reschedulingTaskId, setReschedulingTaskId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");

  // Score Modal State
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreModalLeadId, setScoreModalLeadId] = useState<string | null>(null);
  const [scoreModalCompanyName, setScoreModalCompanyName] = useState<string>("");

  // Fetch all tasks for the logged in user
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['action_center_tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          opportunities (
            id,
            title,
            lead_score,
            legacy_lead_id,
            status,
            stage,
            accounts (
              id, name
            )
          )
        `)
        .eq('workspace_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Complete Task Mutation
  const completeMutation = useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) throw error;

      // Log activity
      const activityType = task.task_type === 'meeting' ? 'meeting' : 
                           task.title.toLowerCase().includes('call') ? 'call' : 'email';
      
      await supabase.from('activities').insert({
        workspace_id: user.id,
        opportunity_id: task.opportunity_id,
        account_id: task.account_id,
        activity_type: activityType,
        title: 'Task Completed',
        description: `Task "${task.title}" marked as completed.`,
        created_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_center_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_opportunities'] });
      toast({ title: "Task completed successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to complete task", description: err.message, variant: "destructive" });
    }
  });

  // Snooze Task Mutation
  const snoozeMutation = useMutation({
    mutationFn: async (task: any) => {
      const currentDue = new Date(task.due_date);
      const newDue = new Date(currentDue.getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: newDue })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_center_tasks'] });
      toast({ title: "Task snoozed by 24 hours" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to snooze task", description: err.message, variant: "destructive" });
    }
  });

  // Reschedule Task Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ taskId, dateStr }: { taskId: string, dateStr: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: new Date(dateStr).toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_center_tasks'] });
      toast({ title: "Task rescheduled successfully" });
      setReschedulingTaskId(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to reschedule task", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Segment tasks
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Filter groups
  const toCall = pendingTasks.filter(t => 
    t.task_type === 'follow_up' && (t.title.toLowerCase().includes('call') || t.description?.toLowerCase().includes('call'))
  );

  const toEmail = pendingTasks.filter(t => 
    t.task_type === 'proposal' || t.title.toLowerCase().includes('email') || t.description?.toLowerCase().includes('email') ||
    t.title.toLowerCase().includes('whatsapp') || t.description?.toLowerCase().includes('whatsapp')
  );

  const toSchedule = pendingTasks.filter(t => 
    t.task_type === 'meeting' || t.title.toLowerCase().includes('meeting')
  );

  const toFollowUp = pendingTasks.filter(t => t.task_type === 'follow_up');

  const todayTasks = pendingTasks.filter(t => {
    const d = new Date(t.due_date);
    return isToday(d);
  });

  const overdueTasks = pendingTasks.filter(t => {
    const d = new Date(t.due_date);
    return isBefore(d, startOfDay(new Date())) && !isToday(d);
  });

  // Get current tab list (sorted by outreach priority score of linked opportunity)
  const getTabTasks = () => {
    let list = [];
    switch (activeTab) {
      case 'calls': list = toCall; break;
      case 'emails': list = toEmail; break;
      case 'meetings': list = toSchedule; break;
      case 'followups': list = toFollowUp; break;
      case 'today': list = todayTasks; break;
      case 'overdue': list = overdueTasks; break;
      case 'completed': return completedTasks.slice(0, 15); // Don't sort completed tasks
      default: list = todayTasks;
    }
    
    return [...list].sort((a, b) => {
      const aScore = a.opportunities?.lead_score || 0;
      const bScore = b.opportunities?.lead_score || 0;
      return bScore - aScore;
    });
  };

  const activeList = getTabTasks();

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary animate-pulse" /> Action Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Your prioritized commercial execution queue. Sorted by automated outreach priority.
        </p>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveTab('calls')}
          className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'calls' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Phone className="w-5 h-5" /></div>
            <h3 className="font-semibold text-sm">Calls Queue</h3>
          </div>
          <div className="text-3xl font-bold">{toCall.length}</div>
        </div>

        <div 
          onClick={() => setActiveTab('emails')}
          className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'emails' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Mail className="w-5 h-5" /></div>
            <h3 className="font-semibold text-sm">Emails Queue</h3>
          </div>
          <div className="text-3xl font-bold">{toEmail.length}</div>
        </div>

        <div 
          onClick={() => setActiveTab('meetings')}
          className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'meetings' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Calendar className="w-5 h-5" /></div>
            <h3 className="font-semibold text-sm">Meetings Queue</h3>
          </div>
          <div className="text-3xl font-bold">{toSchedule.length}</div>
        </div>

        <div 
          onClick={() => setActiveTab('overdue')}
          className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'overdue' ? 'bg-rose-500/10 border-rose-500 shadow-sm' : 'bg-card border-white/5 hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
            <h3 className="font-semibold text-sm">Overdue Actions</h3>
          </div>
          <div className="text-3xl font-bold text-rose-500">{overdueTasks.length}</div>
        </div>
      </div>

      {/* Main Execution Queue */}
      <Card className="bg-card border-white/5 shadow-md">
        <CardHeader className="pb-3 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Prioritized Queue</CardTitle>
            <CardDescription>Executions prioritized by opportunity strength and confidence.</CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'today' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Due Today ({todayTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'calls' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Calls ({toCall.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'emails' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Emails ({toEmail.length})
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'meetings' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Meetings ({toSchedule.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'completed' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-white/5">
          {activeList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">You're all caught up!</h3>
              <p className="max-w-md mx-auto mt-2 text-xs">There are no pending actions in this queue.</p>
            </div>
          ) : (
            activeList.map((task: any) => {
              const outreachScore = task.opportunities?.lead_score || 0;
              const account = task.opportunities?.accounts;
              const isComp = task.status === 'completed';

              return (
                <div key={task.id} className="p-6 hover:bg-white/[0.01] transition-colors flex flex-col md:flex-row gap-4 items-start justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-foreground text-base">{task.title}</h3>
                      {!isComp && outreachScore > 0 && (
                        <Badge 
                          variant="outline" 
                          className="bg-primary/5 text-primary border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScoreModalLeadId(task.opportunities?.legacy_lead_id || task.opportunities?.id);
                            setScoreModalCompanyName(account?.name || "Unknown Company");
                            setIsScoreModalOpen(true);
                          }}
                        >
                          Lead Score: {outreachScore}
                        </Badge>
                      )}
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={
                            task.priority.toLowerCase() === 'critical' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : task.priority.toLowerCase() === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/5 text-muted-foreground border-white/5'
                          }
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{task.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground/80">
                        Opp: {task.opportunities?.title || "No Opportunity Linked"}
                      </span>
                      {account && (
                        <>
                          <span>•</span>
                          <span>Company: {account.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 
                        {isComp 
                          ? `Completed ${formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}`
                          : `Due ${format(new Date(task.due_date), 'MMM d, yyyy')}`
                        }
                      </span>
                    </div>

                    {reschedulingTaskId === task.id && (
                      <div className="pt-3 flex items-center gap-2 max-w-sm animate-in slide-in-from-top-2 duration-200">
                        <input 
                          type="date" 
                          value={newDueDate} 
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="bg-background border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                        />
                        <Button 
                          size="sm"
                          onClick={() => rescheduleMutation.mutate({ taskId: task.id, dateStr: newDueDate })}
                        >
                          Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setReschedulingTaskId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isComp && (
                    <div className="flex flex-wrap items-center gap-2 md:self-center">
                      <Button 
                        size="sm" 
                        onClick={() => completeMutation.mutate(task)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => snoozeMutation.mutate(task)}
                      >
                        Snooze 24h
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setReschedulingTaskId(task.id);
                          setNewDueDate(format(new Date(task.due_date), 'yyyy-MM-dd'));
                        }}
                      >
                        Reschedule
                      </Button>
                      {task.opportunity_id && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/opportunities/${task.opportunity_id}`)}
                          className="p-1 h-8 w-8 rounded-full"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <LeadScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        leadId={scoreModalLeadId}
        companyName={scoreModalCompanyName}
      />
    </div>
  );
}
