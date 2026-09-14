import { OpportunitySignal } from "./SignalTypes";
import { SignalAggregationEngine, AggregatedSignal } from "./SignalAggregationEngine";

export interface TimelineGroup {
  date: string;
  signals: (OpportunitySignal | AggregatedSignal)[];
  summary?: string;
}

export class OpportunitySignalTimelineBuilder {
  /**
   * Transforms raw signals into a chronological, aggregated timeline suitable for UI rendering.
   */
  static build(signals: OpportunitySignal[]): TimelineGroup[] {
    // 1. First, pass signals through the Aggregation Engine to collapse noise
    const aggregatedSignals = SignalAggregationEngine.aggregate(signals, 24);

    // 2. Sort all signals descending (newest first)
    aggregatedSignals.sort((a, b) => 
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );

    // 3. Group by ISO Date String (YYYY-MM-DD)
    const groupsMap = new Map<string, (OpportunitySignal | AggregatedSignal)[]>();

    aggregatedSignals.forEach(signal => {
      // Extract just the date part (e.g., '2026-07-12')
      const dateKey = signal.detected_at.split('T')[0];
      
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      
      groupsMap.get(dateKey)!.push(signal);
    });

    // 4. Format into array of TimelineGroups
    const timeline: TimelineGroup[] = [];
    
    // The keys are already somewhat sorted because we iterated through a sorted array,
    // but to be absolutely sure, we sort the groups themselves.
    const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    for (const date of sortedDates) {
      const signalsForDate = groupsMap.get(date)!;
      timeline.push({
        date: date,
        signals: signalsForDate
      });
    }

    return timeline;
  }
}
