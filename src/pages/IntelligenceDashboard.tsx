import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalBadge } from "@/components/intelligence/SignalBadge";
import { Loader2, Activity, Radar, Map, Building2, Flame, AlertCircle, Pickaxe, Eye } from "lucide-react";
import { Signal } from "@/lib/intelligence/BaseSignalExtractor";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export default function IntelligenceDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: sigData } = await supabase
        .from('signals')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(30);
      
      if (sigData) setRecentSignals(sigData as Signal[]);

      const { data: compData } = await supabase
        .from('companies')
        .select('id, company_name, industry, location')
        .limit(20);
      
      if (compData) setCompanies(compData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCompanies = useMemo(() => {
    // Mock signal volume mapping for demo
    return [...companies].map(c => ({
      ...c,
      signalCount: Math.floor(Math.random() * 8) + 1
    })).sort((a, b) => b.signalCount - a.signalCount).slice(0, 5);
  }, [companies]);

  const industryAggregates = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach(c => {
      const ind = c.industry || 'Unknown';
      counts[ind] = (counts[ind] || 0) + Math.floor(Math.random() * 5) + 1; // mock signal density
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [companies]);

  const regionalAggregates = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach(c => {
      const loc = c.location || 'Global';
      counts[loc] = (counts[loc] || 0) + Math.floor(Math.random() * 5) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [companies]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-24 max-w-7xl mx-auto">
      <Navigation />
      
      <div className="bg-card/40 border border-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
            <Radar className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground">Market activity, readiness tracking, and signal exploration.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 bg-black/20 hover:bg-white/5">
            <Eye className="w-4 h-4 mr-2" /> Watchlists
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Market Activity Center (Left/Center Col) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Market Activity Center</CardTitle>
              <CardDescription>Real-time feed of signals detected across the market.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSignals.map(sig => (
                  <div key={sig.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 hover:bg-white/[0.02] border border-white/5 rounded-lg transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground/90">{sig.signal_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Detected via <span className="font-medium text-foreground/70">{sig.signal_source}</span></p>
                      {sig.raw_payload?.title && <p className="text-xs italic text-muted-foreground mt-1 line-clamp-1">"{sig.raw_payload.title}"</p>}
                    </div>
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0">
                      <SignalBadge strength={sig.signal_strength} />
                      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{formatDistanceToNow(new Date(sig.detected_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets (Right Col) */}
        <div className="space-y-6">
          
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Flame className="w-4 h-4 text-rose-500" /> Most Active Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeCompanies.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 border border-transparent">
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{c.company_name}</p>
                      <p className="text-xs text-muted-foreground">{c.industry}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{c.signalCount} signals</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Pickaxe className="w-4 h-4 text-emerald-400" /> Industry Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {industryAggregates.map(([ind, count]) => (
                  <div key={ind} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 border border-transparent">
                    <p className="font-medium text-sm">{ind}</p>
                    <span className="text-xs text-emerald-400 font-semibold">{count} signals</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Map className="w-4 h-4 text-amber-400" /> Regional Hotspots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {regionalAggregates.map(([loc, count]) => (
                  <div key={loc} className="flex justify-between items-center p-2 rounded-md hover:bg-white/5 border border-transparent">
                    <p className="font-medium text-sm">{loc}</p>
                    <span className="text-xs text-amber-400 font-semibold">{count} signals</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
