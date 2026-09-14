import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Target, AlertTriangle, TrendingUp, Clock, ListTodo, Activity, CalendarDays, 
  BrainCircuit, ShieldAlert, Sparkles, CheckCircle2, ChevronDown, ChevronUp, 
  Mail, Phone, Linkedin, Link2, Flame, Building2, Radar, Calendar, Compass, Star, CalendarCheck
} from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfDay } from "date-fns";
import { GlobalSearch } from "@/components/workspace/GlobalSearch";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend, FunnelChart, Funnel, Cell 
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard3() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.email === 'trial1@jasconnectt.in') {
      navigate('/workspace', { replace: true });
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<'contact' | 'followup' | 'improved' | 'new' | 'stale'>('contact');
  const [expandedOppId, setExpandedOppId] = useState<string | null>(null);

  // 1. Fetch Opportunities
  const { data: opportunities = [], isLoading: loadOpps } = useQuery({
    queryKey: ["dashboard_opportunities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, accounts(*)")
        .eq("workspace_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 2. Fetch Tasks
  const { data: tasks = [], isLoading: loadTasks } = useQuery({
    queryKey: ["dashboard_tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 3. Fetch Activities
  const { data: activities = [], isLoading: loadActs } = useQuery({
    queryKey: ["dashboard_activities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("workspace_id", user.id)
        .order("activity_timestamp", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const loading = loadOpps || loadTasks || loadActs;

  // --- Dynamic Calculations ---
  // Opportunities Stages
  const totalCount = opportunities.length;
  const discoveryCount = opportunities.filter(o => o.stage === 'discovery').length;
  const qualificationCount = opportunities.filter(o => o.stage === 'qualification').length;
  const outreachCount = opportunities.filter(o => o.stage === 'outreach').length;
  const wonCount = opportunities.filter(o => o.status === 'won' || o.stage === 'won').length;
  const lostCount = opportunities.filter(o => o.status === 'lost' || o.stage === 'lost').length;
  const proposalCount = opportunities.filter(o => o.stage === 'proposal').length;
  const negotiationCount = opportunities.filter(o => o.stage === 'negotiation').length;

  // Average Scores
  const avgLeadScore = totalCount > 0
    ? Math.round(opportunities.reduce((acc, o) => acc + (o.lead_score || 0), 0) / totalCount)
    : 0;

  const conversionRate = (wonCount + lostCount) > 0 
    ? Math.round((wonCount / (wonCount + lostCount)) * 100) 
    : 0;

  // Activity counts
  const callsCount = activities.filter(a => a.activity_type === 'call').length;
  const emailsCount = activities.filter(a => a.activity_type === 'email').length;
  const whatsappCount = activities.filter(a => a.activity_type === 'whatsapp').length;
  const meetingsCount = activities.filter(a => a.activity_type === 'meeting').length;

  // Task counts
  const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const tasksPending = tasks.filter(t => t.status === 'pending').length;
  const tasksOverdue = tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).length;

  // Stale and At Risk Opps
  const tenDaysAgo = subDays(new Date(), 10);
  const staleOpps = opportunities.filter(o => o.status === 'open' && o.stage !== 'won' && o.stage !== 'lost' && new Date(o.updated_at || o.created_at) < tenDaysAgo);
  const lowConfidenceOpps = opportunities.filter(o => o.status === 'open' && o.confidence_overall < 40);

  // --- Charts Data Aggregations (Past 14 Days) ---
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    return format(d, 'yyyy-MM-dd');
  });

  // 1. Opportunities Created & Scores trend
  const opportunitiesTrendData = last14Days.map(dateStr => {
    const oppsCreatedThisDay = opportunities.filter(o => o.created_at && !isNaN(new Date(o.created_at).getTime()) && format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
    const avgScoreThisDay = oppsCreatedThisDay.length > 0
      ? Math.round(oppsCreatedThisDay.reduce((acc, o) => acc + (o.opportunity_strength || o.lead_score || 0), 0) / oppsCreatedThisDay.length)
      : 0;
    
    return {
      date: format(new Date(dateStr), 'MMM d'),
      Created: oppsCreatedThisDay.length,
      "Average Score": avgScoreThisDay
    };
  });

  // 2. Activities per day (Calls, Emails, Meetings)
  const activitiesTrendData = last14Days.map(dateStr => {
    const dayActs = activities.filter(a => a.activity_timestamp && !isNaN(new Date(a.activity_timestamp).getTime()) && format(new Date(a.activity_timestamp), 'yyyy-MM-dd') === dateStr);
    return {
      date: format(new Date(dateStr), 'MMM d'),
      Calls: dayActs.filter(a => a.activity_type === 'call').length,
      Emails: dayActs.filter(a => a.activity_type === 'email').length,
      Meetings: dayActs.filter(a => a.activity_type === 'meeting').length,
      Total: dayActs.length
    };
  });

  // 3. Tasks Completed per day
  const tasksCompletedTrendData = last14Days.map(dateStr => {
    const dayTasks = tasks.filter(t => t.status === 'completed' && t.completed_at && !isNaN(new Date(t.completed_at).getTime()) && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr);
    return {
      date: format(new Date(dateStr), 'MMM d'),
      Completed: dayTasks.length
    };
  });

  // 4. Conversion Funnel Data
  const funnelData = [
    { name: "Discovery", value: discoveryCount, fill: "#3b82f6" },
    { name: "Qualification", value: qualificationCount, fill: "#6366f1" },
    { name: "Outreach", value: outreachCount, fill: "#a855f7" },
    { name: "Proposal", value: proposalCount, fill: "#ec4899" },
    { name: "Negotiation", value: negotiationCount, fill: "#f43f5e" },
    { name: "Won", value: wonCount, fill: "#10b981" }
  ];

  // 5. Weekly/Monthly Sales Won Performance (Fallback to dates)
  const wonOpps = opportunities.filter(o => o.status === 'won' || o.stage === 'won');
  const wonPerformanceData = [
    { period: "Week 1", Value: wonOpps.slice(0, Math.ceil(wonOpps.length/4)).reduce((acc, o) => acc + (o.estimated_value || 0), 0) },
    { period: "Week 2", Value: wonOpps.slice(Math.ceil(wonOpps.length/4), Math.ceil(wonOpps.length/2)).reduce((acc, o) => acc + (o.estimated_value || 0), 0) },
    { period: "Week 3", Value: wonOpps.slice(Math.ceil(wonOpps.length/2), Math.ceil(wonOpps.length*3/4)).reduce((acc, o) => acc + (o.estimated_value || 0), 0) },
    { period: "Week 4", Value: wonOpps.slice(Math.ceil(wonOpps.length*3/4)).reduce((acc, o) => acc + (o.estimated_value || 0), 0) },
  ];

  // --- Dynamic Suggestions / Recommended Actions Queue ---
  const reminderTasks = tasks
    .filter(t => t.task_type === 'reminder' && t.status === 'pending')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const suggestions = React.useMemo(() => {
    const list: any[] = [];

    // Overdue tasks
    tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).slice(0, 2).forEach(t => {
      const linkedOpp = opportunities.find(o => o.id === t.opportunity_id);
      list.push({
        id: `task-overdue-${t.id}`,
        title: "Overdue Task Pending",
        description: `Complete the pending task "${t.title}" for ${linkedOpp?.title || "associated account"}.`,
        priority: "Critical",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        actionText: "Open Tasks",
        onClick: () => navigate("/tasks")
      });
    });

    // Stale Opportunities
    staleOpps.slice(0, 2).forEach(opp => {
      list.push({
        id: `stale-opp-${opp.id}`,
        title: "Stale Opportunity",
        description: `Opportunity "${opp.title}" has had no activity updates for over 10 days.`,
        priority: "High",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        actionText: "View Opp",
        onClick: () => navigate(`/opportunities/${opp.id}`)
      });
    });

    // High Priority Opportunities without active task
    opportunities.filter(o => o.status === 'open' && (o.priority?.toLowerCase() === 'critical' || o.priority?.toLowerCase() === 'high'))
      .filter(o => !tasks.some(t => t.opportunity_id === o.id && t.status === 'pending'))
      .slice(0, 2)
      .forEach(opp => {
        list.push({
          id: `no-task-opp-${opp.id}`,
          title: "Missing Plan Action",
          description: `High priority opportunity "${opp.title}" does not have any pending tasks scheduled.`,
          priority: "High",
          badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          actionText: "Add Task",
          onClick: () => navigate("/tasks")
        });
      });

    return list;
  }, [tasks, opportunities, staleOpps, navigate]);

  // Tab Filtering for Outreach List
  const tabOpportunities = React.useMemo(() => {
    switch (activeTab) {
      case 'contact':
        return [...opportunities]
          .filter(o => o.status === 'open' && o.stage !== 'won' && o.stage !== 'lost')
          .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
          .slice(0, 6);
      case 'followup':
        return [...opportunities]
          .filter(o => o.status === 'open' && o.stage === 'outreach')
          .slice(0, 6);
      case 'improved':
        return [...opportunities]
          .filter(o => o.status === 'open' && (o.lead_score || 0) > 50)
          .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
          .slice(0, 6);
      case 'new':
        return [...opportunities]
          .filter(o => o.status === 'open')
          .sort((a, b) => {
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 6);
      case 'stale':
        return staleOpps.slice(0, 6);
      default:
        return [];
    }
  }, [opportunities, activeTab, staleOpps]);

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="h-screen bg-background flex flex-col justify-center items-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-6">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2">Opportunity Intelligence Command Center</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          No opportunities have been detected yet. JAS CONNECT acts as an automated intelligence engine, transforming raw market signals into revenue-generating execution plans.
        </p>
        <Button onClick={() => navigate("/tenders")} size="lg">Scan Lead Database</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-8 flex flex-col gap-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Today's Focus</h1>
            <p className="text-muted-foreground">Immediate priorities requiring your attention.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20">
              <CalendarDays className="w-4 h-4 mr-2" /> {format(new Date(), 'MMMM d, yyyy')}
            </Badge>
            <GlobalSearch />
          </div>
        </div>

        {/* SECTION 1: CRITICAL CRM STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-rose-500/10 border-rose-500/20 shadow-md">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-sm text-rose-400 font-semibold uppercase tracking-wider">Critical Opps</span>
              <span className="text-3xl font-bold text-rose-500">{opportunities.filter(o => o.priority?.toLowerCase() === 'critical').length}</span>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20 shadow-md">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-sm text-blue-400 font-semibold uppercase tracking-wider">High Probability</span>
              <span className="text-3xl font-bold text-blue-500">{opportunities.filter(o => (o.lead_score || 0) > 75).length}</span>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/20 shadow-md">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-sm text-amber-400 font-semibold uppercase tracking-wider">Stale Targets</span>
              <span className="text-3xl font-bold text-amber-500">{staleOpps.length}</span>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20 shadow-md">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-sm text-purple-400 font-semibold uppercase tracking-wider">Overdue Tasks</span>
              <span className="text-3xl font-bold text-purple-500">{tasksOverdue}</span>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-md">
            <CardContent className="p-5 flex flex-col gap-1">
              <span className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">Won Value</span>
              <span className="text-3xl font-bold text-emerald-500">${(wonOpps.reduce((acc, o) => acc + (o.estimated_value || 0), 0) / 1000).toFixed(1)}k</span>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: LIFE-CYCLE PERFORMANCE INDEX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Pipeline Leads</span>
            <span className="text-3xl font-bold text-primary mt-1">{totalCount}</span>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Avg Lead Score</span>
            <span className="text-3xl font-bold text-amber-400 mt-1">{avgLeadScore}</span>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Conversion Rate</span>
            <span className="text-3xl font-bold text-emerald-400 mt-1">{conversionRate}%</span>
          </div>
        </div>

        {/* SECTION 3: PIPELINE STAGE LIFECYCLE SUMMARY */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" /> Funnel Lifecycle Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Discovery</span>
              <span className="text-2xl font-bold mt-1">{discoveryCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Qualification</span>
              <span className="text-2xl font-bold mt-1">{qualificationCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Outreach</span>
              <span className="text-2xl font-bold mt-1">{outreachCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Proposal</span>
              <span className="text-2xl font-bold mt-1">{proposalCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Negotiation</span>
              <span className="text-2xl font-bold mt-1">{negotiationCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Won</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1">{wonCount}</span>
            </div>
            <div className="bg-card/40 border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Lost</span>
              <span className="text-2xl font-bold text-rose-500 mt-1">{lostCount}</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Opportunities Created vs Average Score */}
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Opportunities Created & Average Score (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opportunitiesTrendData}>
                  <defs>
                    <linearGradient id="colorOpps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} />
                  <YAxis stroke="#ffffff60" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                  <Legend />
                  <Area type="monotone" dataKey="Created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOpps)" />
                  <Line type="monotone" dataKey="Average Score" stroke="#ec4899" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Activities per Day */}
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" /> System Communication Activities (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activitiesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} />
                  <YAxis stroke="#ffffff60" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                  <Legend />
                  <Bar dataKey="Calls" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Emails" fill="#a855f7" stackId="a" />
                  <Bar dataKey="Meetings" fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Conversion Funnel */}
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Radar className="h-4 w-4 text-purple-400" /> Pipeline Funnel Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={funnelData} margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" stroke="#ffffff60" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#ffffff60" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                  <Bar dataKey="value" fill="#6366f1">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Tasks Completed & Won Performance */}
          <Card className="bg-card/40 border-white/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-amber-400" /> Tasks Productivity & Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tasksCompletedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} />
                  <YAxis stroke="#ffffff60" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Completed" name="Tasks Completed" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* SECTION 5: RECOMMENDED ACTIONS QUEUE & REMINDERS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="bg-card/40 border-white/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Recommended Actions Queue
            </CardTitle>
            <CardDescription>Dynamic priorities auto-generated based on overdue tasks and stale records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                  System execution queue clear. No urgent actions required.
                </div>
              ) : (
                suggestions.map(sug => (
                  <div key={sug.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex justify-between items-start gap-4 hover:border-white/10 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={sug.badgeColor}>{sug.priority}</Badge>
                        <h4 className="font-semibold text-sm text-foreground">{sug.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{sug.description}</p>
                    </div>
                    <Button size="sm" onClick={sug.onClick} className="shrink-0">{sug.actionText}</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-white/5 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-400" /> Upcoming Reminders
            </CardTitle>
            <CardDescription>Follow-ups and reminders scheduled from the Contact Center.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminderTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                  No upcoming reminders. Set them from the Contact Center.
                </div>
              ) : (
                reminderTasks.map(task => {
                  const opp = opportunities.find(o => o.id === task.opportunity_id);
                  return (
                    <div key={task.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex justify-between items-start gap-4 hover:border-white/10 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {task.due_date && !isNaN(new Date(task.due_date).getTime()) ? format(new Date(task.due_date), 'MMM d, p') : 'No due date'}
                          </Badge>
                          <h4 className="font-semibold text-sm text-foreground">{opp?.title || 'Unknown Opportunity'}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{task.description || "Follow up call/message."}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/opportunities/${task.opportunity_id}`)}>View</Button>
                        <Button size="sm" onClick={async () => {
                          try {
                            const { error } = await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
                            if (error) throw error;
                            // Optionally invalidates queries using queryClient, but we reload or optimistic update.
                            window.location.reload();
                          } catch (e) { console.error(e); }
                        }}>
                          Mark Done
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6: MAIN INTERACTIVE CRM GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-card border border-white/5 shadow-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" /> CRM Outreach Center
                    </CardTitle>
                    <CardDescription>Actionable lead groups ranked by priority algorithms.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                      onClick={() => { setActiveTab('contact'); setExpandedOppId(null); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'contact' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" /> Top To Contact
                    </button>
                    <button
                      onClick={() => { setActiveTab('followup'); setExpandedOppId(null); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'followup' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Follow-Up
                    </button>
                    <button
                      onClick={() => { setActiveTab('improved'); setExpandedOppId(null); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'improved' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> High Prob
                    </button>
                    <button
                      onClick={() => { setActiveTab('new'); setExpandedOppId(null); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'new' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> New
                    </button>
                    <button
                      onClick={() => { setActiveTab('stale'); setExpandedOppId(null); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === 'stale' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Stale
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground">
                      <tr>
                        <th className="p-4 font-medium">Opportunity</th>
                        <th className="p-4 font-medium text-center">Stage</th>
                        <th className="p-4 font-medium text-center w-36">Lead Score</th>
                        <th className="p-4 font-medium text-right w-16">Insights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tabOpportunities.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No opportunities found.
                          </td>
                        </tr>
                      ) : (
                        tabOpportunities.map((opp) => {
                          const leadScore = opp.lead_score ?? null;
                          const isExpanded = expandedOppId === opp.id;
                          
                          return (
                            <React.Fragment key={opp.id}>
                              <tr className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4">
                                  <div className="font-semibold text-foreground text-sm">{opp.title}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[320px] mt-1">
                                    {opp.recommended_action || "Automated intelligence analysis pending."}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <Badge variant="outline" className="capitalize text-[11px] font-semibold px-2 py-0.5">
                                    {opp.stage}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                      {leadScore !== null ? (
                                        <span className={leadScore > 60 ? 'text-primary' : 'text-slate-400'}>
                                          {leadScore}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 italic">Pending</span>
                                      )}
                                    </div>
                                    <Progress value={leadScore ?? 0} className="h-1.5 bg-white/5" />
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setExpandedOppId(isExpanded ? null : opp.id)}
                                    className="p-1 h-8 w-8 rounded-full"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </Button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-white/[0.01] border-l-2 border-primary">
                                  <td colSpan={5} className="p-5 border-t border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="space-y-1.5">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Why This Opportunity</h4>
                                        <p className="text-xs text-foreground/90 leading-relaxed">
                                          {opp.explanation?.why_this_opportunity || 'This opportunity represents a high-potential account matching target category profiles.'}
                                        </p>
                                      </div>
                                      
                                      <div className="space-y-1.5">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Score</h4>
                                        <div className="grid grid-cols-1 gap-2 text-xs">
                                          <div className="p-2 rounded bg-white/5">
                                            <span className="text-muted-foreground block text-[10px] uppercase">OIE Score</span>
                                            <span className="font-bold text-foreground">{opp.lead_score ?? '—'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recommended Next Action</h4>
                                        <div className="flex flex-col gap-2">
                                          <p className="text-xs text-foreground/90 font-semibold">
                                            {opp.explanation?.recommended_action || opp.recommended_action || 'Review contact profiles'}
                                          </p>
                                          <Button size="sm" onClick={() => navigate(`/opportunities/${opp.id}`)} className="w-full">
                                            Open Intelligence Profile
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Risks & System activity */}
          <div className="space-y-8">
            <Card className="bg-rose-500/5 border-rose-500/20 shadow-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2 text-rose-500"><AlertTriangle className="w-5 h-5" /> Opportunities At Risk</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-white/5">
                  <span className="text-sm font-medium">Missed Follow-Ups</span>
                  <span className="font-bold text-rose-500 text-lg">{tasksOverdue}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-white/5">
                  <span className="text-sm font-medium">Low Confidence Signals</span>
                  <span className="font-bold text-amber-500 text-lg">{lowConfidenceOpps.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-white/5">
                  <span className="text-sm font-medium">Stale Targets</span>
                  <span className="font-bold text-rose-500 text-lg">{staleOpps.length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/5 shadow-md flex-1">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No recent activity detected.</div>
                  ) : (
                    activities.slice(0, 10).map(act => (
                      <div key={act.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-xs text-foreground uppercase tracking-wider">{act.activity_type}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {act.activity_timestamp && !isNaN(new Date(act.activity_timestamp).getTime()) ? formatDistanceToNow(new Date(act.activity_timestamp), {addSuffix: true}) : ''}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">{act.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
