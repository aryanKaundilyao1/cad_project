import { OpportunitySignal } from "./SignalTypes";

export interface AggregatedSignal extends OpportunitySignal {
  is_aggregated: boolean;
  aggregated_count: number;
  original_signals: OpportunitySignal[];
}

export class SignalAggregationEngine {
  /**
   * Prevents signal overload by aggregating similar signals that occur within a time window.
   * Example: 12 Website Visits in 24 hours becomes "High Intent Activity Surge"
   */
  static aggregate(signals: OpportunitySignal[], windowHours: number = 24): (OpportunitySignal | AggregatedSignal)[] {
    const sortedSignals = [...signals].sort((a, b) => 
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );

    const aggregated: (OpportunitySignal | AggregatedSignal)[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < sortedSignals.length; i++) {
      const current = sortedSignals[i];
      
      if (processedIds.has(current.id)) continue;
      
      const currentDetected = new Date(current.detected_at).getTime();
      const windowStart = currentDetected - (windowHours * 60 * 60 * 1000);
      
      // Find all signals of the same type within the time window
      const similarSignals = sortedSignals.filter(s => 
        !processedIds.has(s.id) &&
        s.signal_type === current.signal_type &&
        new Date(s.detected_at).getTime() >= windowStart &&
        new Date(s.detected_at).getTime() <= currentDetected
      );

      // If we have a surge (e.g. > 3 signals of same type in window), aggregate them
      if (similarSignals.length > 3) {
        similarSignals.forEach(s => processedIds.add(s.id));
        
        // Calculate bounded aggregate impact
        const totalImpact = similarSignals.reduce((sum, s) => sum + Number(s.impact_score), 0);
        const cappedImpact = Math.min(totalImpact, Number(current.impact_score) * 2.5); // Cap at 2.5x max

        aggregated.push({
          ...current,
          id: `agg_${current.id}`,
          signal_type: `${current.signal_type} Surge`,
          impact_score: cappedImpact,
          is_aggregated: true,
          aggregated_count: similarSignals.length,
          original_signals: similarSignals,
          evidence: {
            summary: `Detected a surge of ${similarSignals.length} ${current.signal_type} events.`,
            details: similarSignals.map(s => s.evidence)
          }
        });
      } else {
        processedIds.add(current.id);
        aggregated.push(current);
      }
    }

    return aggregated;
  }
}
