import { useState, useEffect } from "react";
import { OpportunitySignalService } from "@/services/intelligence/signals/OpportunitySignalService";
import { OpportunitySignalTimelineBuilder, TimelineGroup } from "@/services/intelligence/signals/OpportunitySignalTimelineBuilder";
import { OpportunitySignal } from "@/services/intelligence/signals/SignalTypes";
import { AggregatedSignal } from "@/services/intelligence/signals/SignalAggregationEngine";
import { Activity, AlertTriangle, ChevronRight, Target } from "lucide-react";
import { SignalDetailDrawer } from "./SignalDetailDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountSignalFeed({ accountId }: { accountId: string }) {
  const [timeline, setTimeline] = useState<TimelineGroup[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<OpportunitySignal | AggregatedSignal | null>(null);

  useEffect(() => {
    // For now, we fetch all active signals for the account's opportunities
    // In a real implementation, there would be an AccountSignalService
    // We will just mock the fetch or use a global fetch for this demo
    setTimeline([]);
  }, [accountId]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          Account Signal Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-8 relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-100 z-0" />
        {timeline.length === 0 ? (
          <div className="text-center text-sm text-slate-500 pt-8">
            No signals detected for this account yet.
          </div>
        ) : null}
      </CardContent>
      <SignalDetailDrawer 
        signal={selectedSignal} 
        isOpen={!!selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
      />
    </Card>
  );
}
