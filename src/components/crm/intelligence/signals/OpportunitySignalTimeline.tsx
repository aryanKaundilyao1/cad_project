import { useState, useEffect } from "react";
import { TimelineGroup } from "@/services/intelligence/signals/OpportunitySignalTimelineBuilder";
import { OpportunitySignalFeed } from "@/services/intelligence/signals/OpportunitySignalFeed";
import { Activity, AlertTriangle, ChevronRight, Target } from "lucide-react";
import { SignalDetailDrawer } from "./SignalDetailDrawer";
import { OpportunitySignal } from "@/services/intelligence/signals/SignalTypes";
import { AggregatedSignal } from "@/services/intelligence/signals/SignalAggregationEngine";

interface OpportunitySignalTimelineProps {
  opportunityId: string;
  masterScore?: number;
}

export function OpportunitySignalTimeline({ opportunityId, masterScore = 50 }: OpportunitySignalTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<OpportunitySignal | AggregatedSignal | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      const feed = await OpportunitySignalFeed.getFeed(opportunityId, masterScore);
      setTimeline(feed.timeline);
    };
    fetchFeed();
  }, [opportunityId, masterScore]);

  return (
    <div className="flex flex-col h-full border-l border-slate-100 bg-white">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          Intelligence Timeline
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8 relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-100 z-0" />

        {timeline.length === 0 ? (
          <div className="text-center text-sm text-slate-500 pt-8">
            No signals detected yet.
          </div>
        ) : (
          timeline.map((group) => (
            <div key={group.date} className="relative z-10">
              <div className="sticky top-0 bg-white py-1 mb-4 z-20">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">
                  {group.date}
                </span>
              </div>
              
              <div className="space-y-4">
                {group.signals.map((signal) => (
                  <div 
                    key={signal.id} 
                    className="flex gap-4 group cursor-pointer"
                    onClick={() => setSelectedSignal(signal)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center ${
                        signal.signal_category === 'Risk' ? 'bg-red-100 text-red-600' :
                        signal.signal_category === 'Opportunity' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {signal.signal_category === 'Risk' ? <AlertTriangle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-slate-800">{signal.signal_type}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {signal.severity} Severity • {signal.confidence}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            Number(signal.impact_score) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {Number(signal.impact_score) > 0 ? '+' : ''}{signal.impact_score}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                      </div>
                      
                      {'is_aggregated' in signal && signal.is_aggregated && (
                        <div className="mt-2 text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded inline-block">
                          Surge: {(signal as AggregatedSignal).aggregated_count} events aggregated
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <SignalDetailDrawer 
        signal={selectedSignal} 
        isOpen={!!selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </div>
  );
}
