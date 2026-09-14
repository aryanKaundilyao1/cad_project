import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { OpportunitySignal } from "@/services/intelligence/signals/SignalTypes";
import { AggregatedSignal } from "@/services/intelligence/signals/SignalAggregationEngine";
import { Activity, AlertTriangle, Clock, ShieldCheck, Zap } from "lucide-react";
import { SignalActionCenter } from "./SignalActionCenter";

interface SignalDetailDrawerProps {
  signal: OpportunitySignal | AggregatedSignal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SignalDetailDrawer({ signal, isOpen, onClose }: SignalDetailDrawerProps) {
  if (!signal) return null;

  const isAggregated = 'is_aggregated' in signal && signal.is_aggregated;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex justify-between items-start">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              {signal.signal_type}
            </SheetTitle>
          </div>
          <SheetDescription>
            Detected on {new Date(signal.detected_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-slate-50">
              {signal.signal_category}
            </Badge>
            <Badge variant="outline" className={
              signal.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
              signal.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {signal.severity} Severity
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {signal.confidence} Confidence
            </Badge>
          </div>

          {/* Impact Block */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Impact Engine Assessment
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Raw Impact Score</p>
                <p className="text-lg font-medium text-slate-800">
                  {Number(signal.impact_score) > 0 ? '+' : ''}{signal.impact_score}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{signal.status}</p>
              </div>
            </div>
            
            {signal.expires_at && (
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span>Expires: {new Date(signal.expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Evidence Block */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Evidence & Traceability</h4>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              {signal.evidence ? (
                <pre>{JSON.stringify(signal.evidence, null, 2)}</pre>
              ) : (
                <span className="text-slate-500 italic">Insufficient Signal Evidence</span>
              )}
            </div>
          </div>

          {/* Surges / Aggregation Details */}
          {isAggregated && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Aggregation Surge Details</h4>
              <p className="text-sm text-slate-600">
                This signal is an aggregation of {(signal as AggregatedSignal).aggregated_count} similar events that occurred within a short time window. The impact score has been bounded.
              </p>
            </div>
          )}

          {/* Action Center */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Action Center</h4>
            <SignalActionCenter signal={signal} />
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  );
}
