import { format } from "date-fns";
import { SignalBadge } from "./SignalBadge";
import { Activity, Briefcase, FileText, Building2, MapPin, Zap } from "lucide-react";
import { Signal } from "@/lib/intelligence/BaseSignalExtractor";

interface SignalTimelineProps {
  signals: Signal[];
  className?: string;
}

export function SignalTimeline({ signals, className = "" }: SignalTimelineProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-xl bg-black/20">
        <Activity className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
        <h3 className="font-medium text-lg">No Intelligence Signals</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          There are currently no signals detected for this entity. The extraction engine will populate this timeline automatically when new data is acquired.
        </p>
      </div>
    );
  }

  // Helper to map signal types to icons
  const getIconForSignal = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('tender') || t.includes('contract')) return <FileText className="w-4 h-4" />;
    if (t.includes('factory') || t.includes('warehouse') || t.includes('expansion')) return <Building2 className="w-4 h-4" />;
    if (t.includes('hire') || t.includes('vendor')) return <Briefcase className="w-4 h-4" />;
    if (t.includes('location')) return <MapPin className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="relative border-l border-white/10 ml-3 md:ml-4 space-y-8 pb-4">
        {signals.map((signal, index) => (
          <div key={signal.id || index} className="relative pl-6 md:pl-8 group">
            {/* Timeline Dot */}
            <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-background group-hover:bg-purple-400 transition-colors" />
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
                    {getIconForSignal(signal.signal_type)}
                  </div>
                  <h4 className="text-base font-semibold text-foreground/90">{signal.signal_type}</h4>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1.5 mb-3">
                  Detected via <span className="font-medium text-foreground/70">{signal.signal_source}</span> with {signal.confidence_score}% confidence.
                  {signal.raw_payload?.title && (
                    <span className="block mt-1 italic text-xs border-l-2 border-white/10 pl-2 py-0.5">
                      "{signal.raw_payload.title}"
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center md:flex-col md:items-end gap-3 shrink-0">
                <SignalBadge 
                  strength={signal.signal_strength} 
                  detectedAt={signal.detected_at} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
