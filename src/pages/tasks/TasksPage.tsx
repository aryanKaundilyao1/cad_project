import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckSquare, Search, Plus, Filter, Calendar, Clock, CheckCircle2, 
  AlertCircle, Sparkles, TrendingUp, Target, PlusCircle, ArrowRight 
} from 'lucide-react';
import { format, isToday, isBefore, isAfter, startOfDay, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TasksPage() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New task form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newType, setNewType] = useState('follow_up');
  const [selectedOppId, setSelectedOppId] = useState('');

  // 1. Fetch Tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks_list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          opportunities (
            id, title,
            accounts (id, name)
          )
        `)
        .eq('workspace_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const dbTasks = data || [];
      
      // Fetch dynamic tasks from leads
      const { data: leadsData } = await supabase
        .from('assigned_leads')
        .select('*, leads(*)')
        .eq('client_id', user.id);
        
      const dynamicTasks = [];
      if (leadsData) {
        leadsData.forEach((al: any) => {
          const lead = al.leads;
          if (!lead) return;
          
          const score = lead.current_score || 0;
          const conf = lead.metadata?.oie_score?.conf_score || 0;
          const hasWebsite = lead.website && lead.website.trim() !== '';
          const hasContact = lead.contact_person || lead.email || lead.phone;
          
          if (!hasWebsite) {
            dynamicTasks.push({
              id: `dyn-web-${lead.id}`,
              title: `Research website for ${lead.company_name}`,
              description: 'This lead has no website verified yet. Find and add their website.',
              due_date: new Date().toISOString(),
              priority: 'medium',
              task_type: 'research',
              status: 'pending',
              opportunities: { title: 'Dynamic Generation' },
              created_at: new Date().toISOString()
            });
          }
          
          if (score >= 80 && !hasContact) {
            dynamicTasks.push({
              id: `dyn-contact-${lead.id}`,
              title: `Find decision maker for ${lead.company_name}`,
              description: 'High score opportunity missing contact details. Use LinkedIn or other sources to find the buyer.',
              due_date: new Date().toISOString(),
              priority: 'high',
              task_type: 'research',
              status: 'pending',
              opportunities: { title: 'Dynamic Generation' },
              created_at: new Date().toISOString()
            });
          }
          
          if (conf < 0.6) {
             dynamicTasks.push({
              id: `dyn-conf-${lead.id}`,
              title: `Verify importer status for ${lead.company_name}`,
              description: 'Confidence score is below threshold. Double check if they actually import the product.',
              due_date: new Date().toISOString(),
              priority: 'medium',
              task_type: 'research',
              status: 'pending',
              opportunities: { title: 'Dynamic Generation' },
              created_at: new Date().toISOString()
            });
          }
          
          if (score >= 80 && conf >= 0.7) {
             dynamicTasks.push({
              id: `dyn-call-${lead.id}`,
              title: `Call buyer at ${lead.company_name}`,
              description: 'Top-ranked opportunity. High score and high confidence.',
              due_date: new Date().toISOString(),
              priority: 'high',
              task_type: 'call',
              status: 'pending',
              opportunities: { title: 'Dynamic Generation' },
              created_at: new Date().toISOString()
            });
          }
        });
      }
      
      return [...dbTasks, ...dynamicTasks];
    },
    enabled: !!user?.id
  });

  // 2. Fetch Opportunities for linking new tasks
  const { data: opportunities = [] } = useQuery({
    queryKey: ['tasks_link_opps', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, account_id')
        .eq('workspace_id', user.id)
        .eq('status', 'open');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Complete Task Mutation
  const completeMutation = useMutation({
    mutationFn: async (task: any) => {
      const isCompleted = task.status === 'completed';
      const nextStatus = isCompleted ? 'pending' : 'completed';
      const completedAt = isCompleted ? null : new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus, completed_at: completedAt })
        .eq('id', task.id);

      if (error) throw error;

      // Log activity if completed
      if (nextStatus === 'completed') {
        const activityType = task.task_type === 'meeting' ? 'meeting' : 
                             task.title.toLowerCase().includes('call') ? 'call' : 'email';
        
        await supabase.from('activities').insert({
          workspace_id: user.id,
          opportunity_id: task.opportunity_id,
          account_id: task.account_id,
          activity_type: activityType,
          title: 'Task Completed',
          description: `Task "${task.title}" completed in Tasks manager.`,
          created_by: user.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks_list'] });
      queryClient.invalidateQueries({ queryKey: ['action_center_tasks'] });
      toast({ title: "Task status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update task", description: err.message, variant: "destructive" });
    }
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const linkedOpp = opportunities.find(o => o.id === selectedOppId);
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          workspace_id: user.id,
          title: newTitle,
          description: newDesc,
          due_date: new Date(newDueDate).toISOString(),
          priority: newPriority,
          task_type: newType,
          opportunity_id: selectedOppId || null,
          account_id: linkedOpp?.account_id || null,
          status: 'pending',
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks_list'] });
      queryClient.invalidateQueries({ queryKey: ['action_center_tasks'] });
      toast({ title: "Task created successfully" });
      setShowCreateForm(false);
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewPriority('medium');
      setNewType('follow_up');
      setSelectedOppId('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to create task", description: err.message, variant: "destructive" });
    }
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDueDate) {
      toast({ title: "Title and Due Date are required", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate();
  };

  // --- Grouping & Filtering ---
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.opportunities?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pending = filteredTasks.filter(t => t.status === 'pending');
  const completed = filteredTasks.filter(t => t.status === 'completed');

  const todayTasks = pending.filter(t => isToday(new Date(t.due_date)));
  const overdueTasks = pending.filter(t => isBefore(new Date(t.due_date), startOfDay(new Date())) && !isToday(new Date(t.due_date)));
  const upcomingTasks = pending.filter(t => isAfter(new Date(t.due_date), startOfDay(new Date())) && !isToday(new Date(t.due_date)));

  // --- Productivity Metrics ---
  const tasksCompletedToday = completed.filter(t => t.completed_at && isToday(new Date(t.completed_at))).length;
  
  const weeklyCompletionRate = React.useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const completedLast7 = completed.filter(t => t.completed_at && new Date(t.completed_at) >= sevenDaysAgo).length;
    const pendingDueLast7 = pending.filter(t => new Date(t.due_date) >= sevenDaysAgo).length;
    const total = completedLast7 + pendingDueLast7;
    return total > 0 ? Math.round((completedLast7 / total) * 100) : 100;
  }, [completed, pending]);

  const avgCompletionTimeHours = React.useMemo(() => {
    const completedWithDuration = completed.filter(t => t.completed_at);
    if (completedWithDuration.length === 0) return 0;
    
    const totalDurationMs = completedWithDuration.reduce((acc, t) => {
      const created = new Date(t.created_at).getTime();
      const done = new Date(t.completed_at).getTime();
      return acc + (done - created);
    }, 0);

    const avgHours = totalDurationMs / completedWithDuration.length / (1000 * 60 * 60);
    return Math.round(avgHours);
  }, [completed]);

  // Motivational Insight
  const getMotivationalInsight = () => {
    if (overdueTasks.length > 0) {
      return {
        text: `You have ${overdueTasks.length} overdue actions. Resolve these roadblocks first to restore pipeline velocity.`,
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
      };
    }
    if (todayTasks.length > 0) {
      return {
        text: `Focus on your ${todayTasks.length} objectives for today. Complete them to maintain commercial momentum!`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
      };
    }
    return {
      text: "Outstanding! All objectives for today are resolved. Your pipeline conversion rate is high.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    };
  };

  const insight = getMotivationalInsight();

  const TaskRow = ({ task }: { task: any }) => {
    const isComp = task.status === 'completed';
    return (
      <div className={`p-4 hover:bg-white/[0.01] transition-colors flex items-center justify-between gap-4 ${isComp ? 'opacity-65' : ''}`}>
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button 
            onClick={() => completeMutation.mutate(task)}
            className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors focus:outline-none ${
              isComp 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'border-white/20 hover:border-primary bg-background'
            }`}
          >
            {isComp && <CheckSquare className="w-3.5 h-3.5" />}
          </button>
          
          <div className="min-w-0 flex-1">
            <h4 className={`font-semibold text-sm text-foreground ${isComp ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
            )}
            
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 flex-wrap">
              {task.opportunities && (
                <span className="font-semibold text-primary/80">
                  Opp: {task.opportunities.title}
                </span>
              )}
              {task.opportunities?.accounts && (
                <span>• Company: {task.opportunities.accounts.name}</span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {isComp 
                  ? `Completed ${format(new Date(task.completed_at), 'MMM d')}`
                  : `Due ${format(new Date(task.due_date), 'MMM d, yyyy')}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8 pb-24 space-y-10 overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Today's Tasks</h1>
          <p className="text-muted-foreground mt-1">Checklist to verify and track if all your tasks for today are completed.</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create Task
        </Button>
      </div>

      {/* SECTION 1: PRODUCTIVITY WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-white/5">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Completed Today</span>
            <span className="text-2xl font-bold text-emerald-500">{tasksCompletedToday}</span>
            <span className="text-[10px] text-muted-foreground">Keep the momentum going!</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-white/5">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Weekly Completion Rate</span>
            <span className="text-2xl font-bold text-primary">{weeklyCompletionRate}%</span>
            <Progress value={weeklyCompletionRate} className="h-1.5 bg-white/5" />
          </CardContent>
        </Card>
        <Card className="bg-card border-white/5">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Avg Completion Time</span>
            <span className="text-2xl font-bold text-amber-400">{avgCompletionTimeHours} Hours</span>
            <span className="text-[10px] text-muted-foreground">Average creation-to-resolution.</span>
          </CardContent>
        </Card>
        <Card className="bg-card border-white/5">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Overdue Blockers</span>
            <span className="text-2xl font-bold text-rose-500">{overdueTasks.length}</span>
            <span className="text-[10px] text-muted-foreground">High risk backlog actions.</span>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: INSIGHTS BANNER */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${insight.color} transition-all`}>
        <Sparkles className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{insight.text}</p>
      </div>

      {/* CREATE TASK SLIDE OUT / EXPANSION */}
      {showCreateForm && (
        <Card className="bg-card border-primary/20 shadow-md animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle className="text-lg">Create New Action Item</CardTitle>
            <CardDescription>Add a task to populate the execution queue immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Task Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g., Call Procurement Director"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Due Date *</label>
                <input 
                  type="date" 
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Link Opportunity</label>
                <select
                  value={selectedOppId}
                  onChange={(e) => setSelectedOppId(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Opportunity...</option>
                  {opportunities.map(o => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Task Description</label>
                <textarea 
                  placeholder="Detail scripts or compliance lists to review..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Task Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="follow_up">Follow Up</option>
                  <option value="meeting">Meeting</option>
                  <option value="proposal">Proposal</option>
                  <option value="qualification">Qualification</option>
                  <option value="requirement_review">Requirement Review</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-end justify-end gap-2 md:col-span-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit">Submit Task</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: DYNAMIC TASK QUEUE GROUPS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Card: Overdue & Today */}
        <Card className="bg-card/40 border-white/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertSquareWrapper icon={AlertCircle} color="text-rose-500" /> Overdue & Today's Actions
            </CardTitle>
            <CardDescription>Critical targets requiring immediate execution.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-white/5">
            {overdueTasks.map(t => <TaskRow key={t.id} task={t} />)}
            {todayTasks.map(t => <TaskRow key={t.id} task={t} />)}
            {(overdueTasks.length === 0 && todayTasks.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No immediate task priorities outstanding.</p>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Upcoming Actions */}
        <Card className="bg-card/40 border-white/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" /> Upcoming Objectives
            </CardTitle>
            <CardDescription>Planned actions scheduled for the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-white/5">
            {upcomingTasks.slice(0, 8).map(t => <TaskRow key={t.id} task={t} />)}
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming objectives scheduled.</p>
            )}
          </CardContent>
        </Card>

        {/* Full Card: Completed Actions */}
        <Card className="bg-card/40 border-white/5 shadow-md xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Recent Completed Actions
            </CardTitle>
            <CardDescription>Logs of recently completed commercial activities.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-white/5">
            {completed.slice(0, 10).map(t => <TaskRow key={t.id} task={t} />)}
            {completed.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No completed actions logged recently.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Simple wrapper to avoid import mismatch for AlertSquare
const AlertSquareWrapper = ({ icon: Icon, color }: { icon: any, color: string }) => {
  return <Icon className={`h-5 w-5 ${color}`} />;
};
