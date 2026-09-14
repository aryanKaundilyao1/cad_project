import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Target, Activity, CheckCircle2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OpportunityScoreBadge } from '@/components/lead/OpportunityScoreBadge';

export default function OpportunityFeed() {
  const { data: feed } = useQuery({
    queryKey: ['opportunity_feed'],
    queryFn: async () => {
      const [opps, cands, signals] = await Promise.all([
        supabase.from('opportunities').select('*, company:jas_companies(company_name), opportunity_priorities(priority_level), opportunity_health(health_status)').order('created_at', { ascending: false }).limit(5),
        supabase.from('opportunity_candidates').select('*, company:jas_companies(company_name)').order('generated_at', { ascending: false }).limit(5),
        supabase.from('signals').select('*, companies:company_signals(company:jas_companies(company_name))').order('detected_at', { ascending: false }).limit(5)
      ]);

      return {
        recentOpps: opps.data || [],
        recentCandidates: cands.data || [],
        recentSignals: signals.data || []
      };
    }
  });

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Opportunity Generation Feed</h1>
        <p className="text-slate-500">Live feed of market signals converting into pipeline opportunities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Candidates Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden flex flex-col">
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">New Candidates</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            {feed?.recentCandidates.map(c => (
              <div key={c.id} className="text-sm border-l-2 border-amber-200 pl-3 py-1">
                <div className="font-medium text-slate-800">{c.company?.company_name || 'Unknown'}</div>
                <div className="text-amber-600 text-xs mt-1 font-semibold">{c.signal_type} ({c.confidence}%)</div>
                <div className="text-slate-400 text-xs mt-1">{formatDistanceToNow(new Date(c.generated_at), { addSuffix: true })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col">
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-emerald-900">Recent Conversions</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            {feed?.recentOpps.map(o => (
              <div key={o.id} className="text-sm border-l-2 border-emerald-200 pl-3 py-1">
                <div className="font-medium text-slate-800 flex justify-between items-center">
                  <span className="line-clamp-1">{o.title}</span>
                  {(o.master_score || o.confidence) && <OpportunityScoreBadge score={o.master_score || o.confidence} />}
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <div className="text-emerald-600 text-xs font-semibold">Stage: {o.stage}</div>
                  
                  {o.opportunity_priorities?.[0]?.priority_level && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      o.opportunity_priorities[0].priority_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      o.opportunity_priorities[0].priority_level === 'HOT' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {o.opportunity_priorities[0].priority_level}
                    </span>
                  )}
                  {o.opportunity_health?.[0]?.health_status && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      o.opportunity_health[0].health_status === 'Healthy' || o.opportunity_health[0].health_status === 'Growing' ? 'bg-emerald-100 text-emerald-700' :
                      o.opportunity_health[0].health_status === 'At Risk' || o.opportunity_health[0].health_status === 'Cooling' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {o.opportunity_health[0].health_status}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-xs mt-1">{formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Signals Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden flex flex-col">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-blue-900">Raw Signals</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-4">
            {feed?.recentSignals.map(s => (
              <div key={s.id} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                <div className="font-medium text-slate-800">{s.signal_type}</div>
                <div className="text-blue-600 text-xs mt-1">Confidence: {s.confidence_score}%</div>
                <div className="text-slate-400 text-xs mt-1">{formatDistanceToNow(new Date(s.detected_at), { addSuffix: true })}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
