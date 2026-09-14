import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { 
  Activity, Radar, Layers, ShieldAlert,
  Loader2, Radio, PlayCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminIntelligenceCenter() {
  const { user, profile, authLoading } = useAuth();
  const navigate = useNavigate();
  const [dataLoading, setDataLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // States
  const [signals, setSignals] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  const fetchRules = async () => {
    const { data } = await supabase.from('intelligence_readiness_rules').select('*').order('created_at', { ascending: false });
    if (data) setRules(data);
  };


  const fetchSignals = async () => {
    const { data } = await supabase.from('signals').select('*').order('detected_at', { ascending: false }).limit(100);
    if (data) setSignals(data);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !profile?.is_admin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        await fetchSignals();

        const { data: sourcesData } = await supabase.from('signal_sources').select('*').order('created_at', { ascending: false });
        if (sourcesData) setSources(sourcesData);

        const { data: eventsData } = await supabase.from('signal_events').select('*').order('created_at', { ascending: false }).limit(50);
        if (eventsData) setEvents(eventsData);
        await fetchRules();

      } catch (error) {
        console.error("Error fetching intelligence data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, profile, authLoading, navigate]);

  const runExtraction = async () => {
    setIsProcessing(true);
    toast.info("Extraction started", { description: "Running backend signal extractors..." });
    // In a real scenario, this would call a Supabase Edge Function to process raw data.
    // For Phase 3B UI, we simulate the processing delay.
    setTimeout(async () => {
      await fetchSignals();
      toast.success("Extraction complete", { description: "Signals have been updated." });
      setIsProcessing(false);
    }, 2000);
  };

  const stats = useMemo(() => {
    return {
      activeSignals: signals.filter(s => s.status === 'Active').length,
      totalSources: sources.length,
      highConfidence: signals.filter(s => s.confidence_score >= 80).length,
      criticalSignals: signals.filter(s => s.signal_strength === 'Critical').length,
      eventsToday: events.filter(e => {
        const today = new Date();
        today.setHours(0,0,0,0);
        return new Date(e.created_at) >= today;
      }).length
    };
  }, [signals, sources, events]);

  // Chart Data preparation
  const sourceDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    signals.forEach(s => {
      dist[s.signal_source] = (dist[s.signal_source] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [signals]);

  const strengthDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0 };
    signals.forEach(s => {
      if (dist[s.signal_strength] !== undefined) dist[s.signal_strength]++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [signals]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const STRENGTH_COLORS = { 'Low': '#64748b', 'Medium': '#3b82f6', 'High': '#8b5cf6', 'Critical': '#ef4444' };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-24 max-w-7xl mx-auto">
      <Navigation />
      
      <div className="bg-card/40 border border-white/5 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Radar className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Intelligence Center</h1>
            <p className="text-sm text-muted-foreground">Monitor and configure the Signal Intelligence Engine.</p>
          </div>
        </div>
        <Button onClick={runExtraction} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
          Run Extraction Engine
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-white/[0.03] border border-white/[0.06] flex w-full h-12 rounded-xl overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 rounded-lg"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
          <TabsTrigger value="signals" className="flex-1 rounded-lg"><Radio className="w-4 h-4 mr-2" /> Signal Monitoring</TabsTrigger>
          <TabsTrigger value="sources" className="flex-1 rounded-lg"><Layers className="w-4 h-4 mr-2" /> Signal Registry</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 rounded-lg"><ShieldAlert className="w-4 h-4 mr-2" /> Audit Logs</TabsTrigger>
          <TabsTrigger value="rules" className="flex-1 rounded-lg"><Sliders className="w-4 h-4 mr-2" /> Readiness Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-card/40 border-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold">{stats.activeSignals}</p>
                <p className="text-sm text-muted-foreground">Active Signals</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-emerald-400">{stats.highConfidence}</p>
                <p className="text-sm text-muted-foreground">High Confidence (&gt;80%)</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-red-400">{stats.criticalSignals}</p>
                <p className="text-sm text-muted-foreground">Critical Strength</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-blue-400">{stats.totalSources}</p>
                <p className="text-sm text-muted-foreground">Configured Sources</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-purple-400">{stats.eventsToday}</p>
                <p className="text-sm text-muted-foreground">Events Today</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-card/40 border-white/5">
              <CardHeader>
                <CardTitle>Signals By Source</CardTitle>
                <CardDescription>Distribution of active intelligence signals across sources.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {sourceDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {sourceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e2d', border: 'none', borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No signal data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 border-white/5">
              <CardHeader>
                <CardTitle>Signal Strength Distribution</CardTitle>
                <CardDescription>Categorization of intelligence severity and urgency.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strengthDistribution}>
                      <XAxis dataKey="name" stroke="#52525b" fontSize={12} />
                      <YAxis stroke="#52525b" fontSize={12} />
                      <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e1e2d', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {strengthDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STRENGTH_COLORS[entry.name as keyof typeof STRENGTH_COLORS] || '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="signals">
          <Card className="bg-card/40 border-white/5">
            <CardHeader>
              <CardTitle>Signal Monitoring</CardTitle>
              <CardDescription>Live feed of all extracted intelligence signals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Detected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No signals detected yet. Run the Extraction Engine.</TableCell></TableRow>
                  ) : (
                    signals.map(signal => (
                      <TableRow key={signal.id} className="border-white/5">
                        <TableCell className="font-medium">{signal.signal_type}</TableCell>
                        <TableCell>{signal.signal_source}</TableCell>
                        <TableCell>
                          <Badge variant={signal.confidence_score >= 90 ? 'default' : 'secondary'} className={signal.confidence_score >= 90 ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                            {signal.confidence_score}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className={
                             signal.signal_strength === 'Critical' ? 'border-red-500/50 text-red-400' :
                             signal.signal_strength === 'High' ? 'border-purple-500/50 text-purple-400' : ''
                           }>
                            {signal.signal_strength}
                           </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{signal.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(signal.detected_at), 'PP p')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card className="bg-card/40 border-white/5">
            <CardHeader>
              <CardTitle>Signal Source Registry</CardTitle>
              <CardDescription>Configure extraction rules and base confidence weights per source.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Source Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Base Weight</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sources registered yet.</TableCell></TableRow>
                  ) : (
                    sources.map(source => (
                      <TableRow key={source.id} className="border-white/5">
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>{source.source_type}</TableCell>
                        <TableCell>{source.extraction_method}</TableCell>
                        <TableCell>{source.confidence_weight}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={source.status === 'Active' ? 'default' : 'secondary'} className={source.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                            {source.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="bg-card/40 border-white/5">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Immutable tracking of signal state changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Event Type</TableHead>
                    <TableHead>Signal ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events logged yet.</TableCell></TableRow>
                  ) : (
                    events.map(event => (
                      <TableRow key={event.id} className="border-white/5">
                        <TableCell>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{event.signal_id.substring(0,8)}...</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{event.reason || 'N/A'}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'PP p')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      
        <TabsContent value="rules">
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Readiness Engine Rules</CardTitle>
                <CardDescription>Configure logic for Opportunity Readiness momentum.</CardDescription>
              </div>
              <Button size="sm" variant="outline">Add Rule</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Resulting Readiness</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No readiness rules configured.</TableCell></TableRow>
                  ) : (
                    rules.map(rule => (
                      <TableRow key={rule.id} className="border-white/5">
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="font-mono text-xs">{JSON.stringify(rule.conditions)}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className={
                             rule.resulting_readiness === 'Critical' ? 'border-red-500/50 text-red-400' :
                             rule.resulting_readiness === 'High' ? 'border-purple-500/50 text-purple-400' :
                             rule.resulting_readiness === 'Medium' ? 'border-blue-500/50 text-blue-400' : ''
                           }>
                            {rule.resulting_readiness}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'} className={rule.is_active ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                            {rule.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
