import { useState, useEffect } from "react";
import { OpportunitySignalFeed } from "@/services/intelligence/signals/OpportunitySignalFeed";
import { OpportunitySignalTimeline } from "./OpportunitySignalTimeline";
import { Activity, AlertCircle } from "lucide-react";

interface SignalFeedTabProps {
  opportunityId: string;
  masterScore?: number;
}

export function SignalFeedTab({ opportunityId, masterScore = 50 }: SignalFeedTabProps) {
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const feed = await OpportunitySignalFeed.getFeed(opportunityId, masterScore);
      setActiveCount(feed.activeCount);
      setCriticalCount(feed.criticalCount);
    };
    fetchStats();
  }, [opportunityId, masterScore]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-100 bg-slate-50">
        <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-blue-100 p-2 rounded-full">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Signals</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center gap-3 shadow-sm">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Critical / Urgent</p>
            <p className="text-xl font-bold text-slate-800">{criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="flex-1 overflow-hidden">
        <OpportunitySignalTimeline opportunityId={opportunityId} masterScore={masterScore} />
      </div>
    </div>
  );
}
