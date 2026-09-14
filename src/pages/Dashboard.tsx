import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle, TrendingUp, Clock, ListTodo, Map, Activity, CalendarDays, BrainCircuit, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalOpps, setTotalOpps] = useState(0);

  // States
  const [focus, setFocus] = useState({ critical: 0, highProb: 0, actionReq: 0, overdue: 0, awaitingValid: 0 });
  const [topOpps, setTopOpps] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [actions, setActions] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState({ missedFollowUps: 0, lowConfidence: 0, stale: 0 });
  const [insights, setInsights] = useState({ highestConf: [], activeSources: [] });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: rankedOpps } = await supabase.from('ranked_opportunities_view').select('*');
    const { data: allOpps } = await supabase.from('opportunities').select('id, stage, created_at, status');
    
    if (allOpps) {
      setTotalOpps(allOpps.length);
    }
    
    if (allOpps && allOpps.length === 0) {
      setLoading(false);
      return; // Skip complex logic if empty
    }

    if (rankedOpps) {
      setTopOpps(rankedOpps.slice(0, 10));
      setFocus(prev => ({
        ...prev,
        critical: rankedOpps.filter(o => o.priority_level === 'Critical').length,
        highProb: rankedOpps.filter(o => (o.lead_score || 0) > 75).length,
      }));
      setAtRisk(prev => ({
        ...prev,
        lowConfidence: rankedOpps.filter(o => (o.lead_score || 0) < 40).length
      }));
    }

    if (allOpps) {
      const pipeCounts: Record<string, number> = {};
      let awaitingValid = 0;
      allOpps.forEach(o => {
        const stage = o.stage || 'discovery';
        pipeCounts[stage] = (pipeCounts[stage] || 0) + 1;
        if (stage === 'validation') awaitingValid++;
      });
      setPipeline(pipeCounts);
      setFocus(prev => ({ ...prev, awaitingValid }));
    }

    // Actions & Overdue Tasks
    const { data: actns } = await supabase.from('opportunity_actions')
      .select('*, opportunities(title), action_registry(action_type, description)')
      .eq('status', 'Pending')
      .order('priority', { ascending: true }) // Critical first (if sorted properly by enum, otherwise just take all)
      .limit(5);
    
    if (actns) setActions(actns);

    const { count: actionReqCount } = await supabase.from('opportunity_intelligence').select('*', { count: 'exact', head: true }).eq('execution_status', 'Action Required');
    const { count: overdueCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', new Date().toISOString());
    
    setFocus(prev => ({
      ...prev,
      actionReq: actionReqCount || 0,
      overdue: overdueCount || 0
    }));

    setAtRisk(prev => ({
      ...prev,
      missedFollowUps: overdueCount || 0,
      stale: 0 // Mocking stale for now as it requires complex join on activities
    }));

    // Changes
    const { data: acts } = await supabase.from('activities').select('*').order('activity_timestamp', { ascending: false }).limit(10);
    if (acts) setChanges(acts);

    setLoading(false);
  };

  const PipelineStage = ({ title, stageKey }: { title: string, stageKey: string }) => (
    <div className="flex-1 min-w-[140px] bg-card border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{title}</span>
      <span className="text-3xl font-display font-bold text-foreground/90">{pipeline[stageKey] || 0}</span>
    </div>
  );

  if (!loading && totalOpps === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center p-6 mt-16 max-w-3xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
            <BrainCircuit className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold">Opportunity Intelligence Command Center</h1>
          <p className="text-lg text-muted-foreground">
            No opportunities have been detected yet. JAS CONNECT acts as an automated intelligence engine, transforming raw market signals into revenue-generating execution plans.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="pb-2">
                <Target className="w-6 h-6 text-blue-400 mb-2" />
                <CardTitle className="text-base">1. Discovery</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">The engine continuously scans global tenders and procurement signals.</CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="pb-2">
                <BrainCircuit className="w-6 h-6 text-purple-400 mb-2" />
                <CardTitle className="text-base">2. Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Signals are scored for Confidence and Order Probability automatically.</CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardHeader className="pb-2">
                <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                <CardTitle className="text-base">3. Execution</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">The Command Center prioritizes actions and automates follow-ups to drive revenue.</CardContent>
            </Card>
          </div>
          <Button size="lg" className="mt-8">Connect Data Sources</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 p-6 pt-24 max-w-[1400px] mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {loading ? (
          <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <>
            {/* SECTION 1: TODAY'S FOCUS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">Today's Focus</h1>
                  <p className="text-muted-foreground">Immediate priorities requiring your attention.</p>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20"><CalendarDays className="w-4 h-4 mr-2" /> {format(new Date(), 'MMMM d, yyyy')}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-rose-500/10 border-rose-500/20 shadow-md">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-sm text-rose-400 font-semibold uppercase tracking-wider">Critical Opps</span>
                    <span className="text-3xl font-bold text-rose-500">{focus.critical}</span>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20 shadow-md">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-sm text-blue-400 font-semibold uppercase tracking-wider">High Probability</span>
                    <span className="text-3xl font-bold text-blue-500">{focus.highProb}</span>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20 shadow-md">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-sm text-amber-400 font-semibold uppercase tracking-wider">Action Required</span>
                    <span className="text-3xl font-bold text-amber-500">{focus.actionReq}</span>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20 shadow-md">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-sm text-purple-400 font-semibold uppercase tracking-wider">Overdue Tasks</span>
                    <span className="text-3xl font-bold text-purple-500">{focus.overdue}</span>
                  </CardContent>
                </Card>
                <Card className="bg-card border-white/10 shadow-md">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Await Validation</span>
                    <span className="text-3xl font-bold">{focus.awaitingValid}</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* SECTION 3: OPPORTUNITY PIPELINE */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400" /> Intelligence Lifecycle</h2>
              <div className="flex overflow-x-auto pb-4 gap-3">
                <PipelineStage title="Discovery" stageKey="discovery" />
                <PipelineStage title="Qualification" stageKey="qualification" />
                <PipelineStage title="Validation" stageKey="validation" />
                <PipelineStage title="Classification" stageKey="classification" />
                <PipelineStage title="Outreach" stageKey="outreach" />
                <PipelineStage title="Negotiation" stageKey="negotiation" />
                <PipelineStage title="Won" stageKey="won" />
                <PipelineStage title="Lost" stageKey="lost" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (Spans 2) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* SECTION 2: TOP OPPORTUNITIES TODAY */}
                <Card className="bg-card border-white/5 shadow-md">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Top Opportunities Today</CardTitle>
                    <CardDescription>Highest probability deals ranked by the engine.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-muted-foreground">
                          <tr>
                            <th className="p-4 font-medium">Opportunity</th>
                            <th className="p-4 font-medium">Stage</th>
                            <th className="p-4 font-medium w-32">Probability</th>
                            <th className="p-4 font-medium">Priority</th>
                            <th className="p-4 font-medium">Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {topOpps.map((opp) => (
                            <tr key={opp.opportunity_id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-foreground">{opp.title}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[250px] mt-1">{opp.intelligence_summary || "Automated intelligence analysis pending."}</div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="capitalize text-xs">{opp.stage || 'discovery'}</Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-between text-xs mb-1 font-medium">
                                  {opp.lead_score != null ? (
                                    <span className={opp.lead_score > 70 ? 'text-emerald-400' : ''}>{opp.lead_score}</span>
                                  ) : (
                                    <span className="text-slate-600 italic">Pending</span>
                                  )}
                                </div>
                                <Progress value={opp.lead_score ?? 0} className="h-1.5" />
                              </td>
                              <td className="p-4">
                                <Badge variant={opp.priority_level === 'Critical' ? 'destructive' : opp.priority_level === 'High' ? 'default' : 'secondary'}>
                                  {opp.priority_level || 'Pending'}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                <span className="font-bold text-xs text-slate-400">{opp.priority_level === 'Critical' ? 'T1' : opp.priority_level === 'High' ? 'T2' : 'T3'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* SECTION 4: RECOMMENDED ACTIONS */}
                <Card className="bg-card border-white/5 shadow-md">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> Recommended Actions</CardTitle>
                    <CardDescription>Next best actions generated by the Action Engine.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {actions.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-muted-foreground">No pending actions. The engine will notify you when action is required.</div>
                      ) : (
                        actions.map(action => (
                          <div key={action.id} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{action.action_registry?.action_type}</span>
                                <Badge variant={action.priority === 'Critical' ? 'destructive' : 'secondary'} className="text-[10px] uppercase h-5">{action.priority}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">For: <span className="font-medium text-foreground/80">{action.opportunities?.title}</span></p>
                              <p className="text-sm mt-1">{action.reason}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {action.suggested_timeline_days} days</span>
                              <Button size="sm" variant="outline">Execute</Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Right Column */}
              <div className="space-y-8">

                {/* SECTION 6: OPPORTUNITIES AT RISK */}
                <Card className="bg-rose-500/5 border-rose-500/20 shadow-md">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2 text-rose-500"><AlertTriangle className="w-5 h-5" /> Opportunities At Risk</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-white/5">
                      <span className="text-sm font-medium">Missed Follow-Ups</span>
                      <span className="font-bold text-rose-500">{atRisk.missedFollowUps}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-white/5">
                      <span className="text-sm font-medium">Low Confidence Signals</span>
                      <span className="font-bold text-amber-500">{atRisk.lowConfidence}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-background/50 border border-white/5">
                      <span className="text-sm font-medium">Stale (7+ days no activity)</span>
                      <span className="font-bold text-rose-500">{atRisk.stale}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* SECTION 5: WHAT CHANGED TODAY */}
                <Card className="bg-card border-white/5 shadow-md flex-1">
                  <CardHeader className="pb-3 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> What Changed Today</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                      {changes.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">No recent activity detected.</div>
                      ) : (
                        changes.map(act => (
                          <div key={act.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-sm text-foreground">{act.activity_type}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(act.activity_timestamp), {addSuffix: true})}</span>
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
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
