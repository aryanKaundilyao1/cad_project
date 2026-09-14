import { Button } from "@/components/ui/button";
import { OpportunitySignal } from "@/services/intelligence/signals/SignalTypes";
import { AggregatedSignal } from "@/services/intelligence/signals/SignalAggregationEngine";
import { ArrowRight, Mail, Calendar, Search } from "lucide-react";

interface SignalActionCenterProps {
  signal: OpportunitySignal | AggregatedSignal;
}

export function SignalActionCenter({ signal }: SignalActionCenterProps) {
  
  // Rule-based deterministic action mapping
  const renderActions = () => {
    const type = signal.signal_type.toLowerCase();
    const category = signal.signal_category.toLowerCase();

    const actions = [];

    if (type.includes("no activity") || type.includes("decay")) {
      actions.push(
        <Button key="follow-up" className="w-full justify-start mb-2" variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Follow Up Now
        </Button>
      );
    }

    if (type.includes("meeting") || type.includes("appointment")) {
      actions.push(
        <Button key="prep" className="w-full justify-start mb-2" variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Review Meeting Prep
        </Button>
      );
    }

    if (type.includes("requirement") || type.includes("budget")) {
      actions.push(
        <Button key="review" className="w-full justify-start mb-2" variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Investigate Details
        </Button>
      );
    }

    if (actions.length === 0) {
      actions.push(
        <Button key="monitor" className="w-full justify-start mb-2" variant="outline">
          <ArrowRight className="h-4 w-4 mr-2" />
          Monitor Opportunity
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="flex flex-col">
      {renderActions()}
    </div>
  );
}
