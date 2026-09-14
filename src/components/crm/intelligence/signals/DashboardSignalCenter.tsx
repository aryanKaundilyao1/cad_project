import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CriticalSignalService } from "@/services/intelligence/signals/CriticalSignalService";
import { OpportunitySignal } from "@/services/intelligence/signals/SignalTypes";
import { AlertTriangle, TrendingUp, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardSignalCenter() {
  const [criticalSignals, setCriticalSignals] = useState<OpportunitySignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCritical = async () => {
      try {
        const signals = await CriticalSignalService.scanForCriticalSignals();
        setCriticalSignals(signals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCritical();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-lg" />;
  }

  const criticalRisks = criticalSignals.filter(s => s.signal_category === 'Risk');
  const criticalOpps = criticalSignals.filter(s => s.signal_category === 'Opportunity');

  return (
    <Card className="col-span-full xl:col-span-4 border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-500" />
          Signal Intelligence Command Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Critical Risks */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Immediate Risks
            </h3>
            {criticalRisks.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No critical risks detected.</p>
            ) : (
              criticalRisks.slice(0, 3).map(sig => (
                <div key={sig.id} className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-red-900">{sig.signal_type}</span>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      {sig.impact_score}
                    </span>
                  </div>
                  <p className="text-xs text-red-700/80 mb-2">Opp ID: {sig.opportunity_id.substring(0,8)}...</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-700 hover:text-red-800 hover:bg-red-100">
                    Investigate <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Critical Opportunities */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Immediate Opportunities
            </h3>
            {criticalOpps.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No critical opportunities detected.</p>
            ) : (
              criticalOpps.slice(0, 3).map(sig => (
                <div key={sig.id} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-emerald-900">{sig.signal_type}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      +{sig.impact_score}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700/80 mb-2">Opp ID: {sig.opportunity_id.substring(0,8)}...</p>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100">
                    Capitalize <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
