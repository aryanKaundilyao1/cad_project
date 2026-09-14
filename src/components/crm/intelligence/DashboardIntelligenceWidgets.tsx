import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Radar, Activity, Building2, Flame } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { SignalBadge } from '@/components/intelligence/SignalBadge';
import { formatDistanceToNow } from 'date-fns';
import { Signal } from '@/lib/intelligence/BaseSignalExtractor';

export function DashboardIntelligenceWidgets() {
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
  const [activeCompanies, setActiveCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recent high/critical signals
        const { data: signalsData } = await supabase
          .from('signals')
          .select('*')
          .in('signal_strength', ['Critical', 'High'])
          .order('detected_at', { ascending: false })
          .limit(5);

        if (signalsData) setRecentSignals(signalsData as Signal[]);

        // Mock active companies based on signal volume (since we don't have a direct materialized view yet for counts)
        // We will just fetch a few companies for the UI representation
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, company_name, industry')
          .limit(5);
        
        if (companiesData) {
          const formatted = companiesData.map(c => ({
            ...c,
            recentSignalCount: Math.floor(Math.random() * 10) + 1 // mock count for UI visualization
          })).sort((a, b) => b.recentSignalCount - a.recentSignalCount);
          setActiveCompanies(formatted);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Intelligence Signals...</div>;
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-xl tracking-tight flex items-center gap-2">
          <Radar className="w-5 h-5 text-purple-500" />
          Intelligence Signals
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Critical Signals */}
        <Card>
          <CardHeader className="pb-3 border-b border-white/5 mb-4 bg-card/40">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" /> Recent High-Priority Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {recentSignals.length === 0 ? <p className="text-muted-foreground">No recent signals detected.</p> : null}
              {recentSignals.map((signal) => (
                <div key={signal.id} className="flex justify-between items-center p-2 hover:bg-white/[0.02] rounded-md transition-colors border border-transparent hover:border-white/5">
                  <div className="flex-1">
                    <p className="font-medium truncate max-w-[250px] text-foreground/90">{signal.signal_type}</p>
                    <p className="text-xs text-muted-foreground mt-1">Source: {signal.signal_source}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      signal.signal_strength === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>
                      {signal.signal_strength}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.detected_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Companies */}
        <Card>
          <CardHeader className="pb-3 border-b border-white/5 mb-4 bg-card/40">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Active Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {activeCompanies.length === 0 ? <p className="text-muted-foreground">No active companies.</p> : null}
              {activeCompanies.map((company) => (
                <div key={company.id} className="flex justify-between items-center p-2 hover:bg-white/[0.02] rounded-md transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px] text-foreground/90">{company.company_name}</p>
                      <p className="text-xs text-muted-foreground">{company.industry || 'Unknown Industry'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-foreground/90">{company.recentSignalCount}</span>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signals</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
