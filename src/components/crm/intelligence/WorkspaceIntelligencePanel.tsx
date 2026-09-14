import React, { useEffect, useState } from 'react';
import { ScoreUIQueryService } from '@/services/intelligence/scoring/ui/ScoreUIQueryService';
import { Zap, Activity, Info, BarChart3, Clock, BrainCircuit, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export function WorkspaceIntelligencePanel({ opportunityId }: { opportunityId: string }) {
  const [explainability, setExplainability] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [exp, hist] = await Promise.all([
          ScoreUIQueryService.getScoreExplainability(opportunityId),
          ScoreUIQueryService.getHistoricalChartData(opportunityId)
        ]);
        setExplainability(exp);
        setHistory(hist);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [opportunityId]);

  if (loading) {
    return <div className="animate-pulse p-4 text-sm text-muted-foreground">Loading Intelligence Profile...</div>;
  }

  if (!explainability) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm text-center">
        <p className="text-sm text-muted-foreground">No intelligence data calculated yet.</p>
      </div>
    );
  }

  const getPillarScore = (name: string) => {
    return explainability.factors?.find((f: any) => f.name === name)?.value || 0;
  };

  const getPillarMax = (name: string) => {
    return explainability.factors?.find((f: any) => f.name === name)?.max || 100;
  };

  const renderProgress = (name: string, color: string) => {
    const val = getPillarScore(name);
    const max = getPillarMax(name);
    const pct = Math.round((val / max) * 100) || 0;
    
    return (
      <div 
        className="cursor-pointer group hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
        onClick={() => setSelectedPillar(selectedPillar === name ? null : name)}
      >
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 group-hover:text-foreground">
            {name.replace(' Pillar', '')}
            <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="text-sm font-bold">{val}</span>
        </div>
        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        
        {/* Drilldown Box */}
        {selectedPillar === name && (
          <div className="mt-3 p-3 bg-background border border-border rounded-lg text-xs space-y-2">
            <h4 className="font-semibold text-foreground border-b border-border pb-1">Explanation</h4>
            <ul className="space-y-1 text-muted-foreground">
              {explainability.evidence.map((ev: string, i: number) => (
                // Super basic filter for this demo to just show the evidence that might relate
                <li key={i} className="flex gap-1 items-start">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Master Score Block */}
      <div className="bg-gradient-to-br from-card to-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 transition-colors" />
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-500" />
              Opportunity Score
            </h3>
            <Badge variant="outline" className={`
              ${explainability.confidence === 'High Confidence' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : ''}
              ${explainability.confidence === 'Medium Confidence' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : ''}
              ${explainability.confidence === 'Low Confidence' ? 'text-rose-500 border-rose-500/30 bg-rose-500/10' : ''}
            `}>
              {explainability.confidence}
            </Badge>
          </div>
          
          <div className="flex items-end gap-3 mb-6">
            <div className="text-5xl font-bold tracking-tighter">
              {explainability.master_score || 0}
            </div>
            <div className="mb-1 text-sm font-medium text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12 (7d)
            </div>
          </div>

          <div className="space-y-1">
            {renderProgress("Fit Pillar", "bg-blue-500")}
            {renderProgress("Intent Pillar", "bg-purple-500")}
            {renderProgress("Timing Pillar", "bg-amber-500")}
            {renderProgress("Engagement Pillar", "bg-emerald-500")}
          </div>
        </div>
      </div>
      
      {/* Historical Trend Placeholder */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Score Momentum
        </h3>
        <div className="h-32 flex items-center justify-center border border-dashed border-border rounded bg-muted/20">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-4 h-4" /> History Chart (Recharts)
          </p>
        </div>
      </div>
    </div>
  );
}
