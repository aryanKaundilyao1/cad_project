import { TimelineGroup } from "./OpportunitySignalTimelineBuilder";
import { SignalCategory, SignalStatus } from "./SignalEnums";
import { OpportunitySignal } from "./SignalTypes";
import { AggregatedSignal } from "./SignalAggregationEngine";

export class SignalStoryEngine {
  /**
   * Converts a chronological timeline of signals into a readable narrative summary.
   */
  static generateNarrative(timeline: TimelineGroup[], currentMasterScore: number): string {
    if (timeline.length === 0) {
      return "No signals have been detected for this opportunity.";
    }

    const sentences: string[] = [];
    
    // Flatten signals to analyze overall trends
    let allSignals: (OpportunitySignal | AggregatedSignal)[] = [];
    timeline.forEach(group => {
      allSignals = allSignals.concat(group.signals);
    });

    const activeSignals = allSignals.filter(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.DECAYING);
    
    // 1. Overall Trend Sentence
    const totalImpact = activeSignals.reduce((sum, s) => sum + Number(s.impact_score), 0);
    
    if (totalImpact > 10) {
      sentences.push("The opportunity is showing strong positive momentum recently.");
    } else if (totalImpact < -10) {
      sentences.push("The opportunity is currently facing significant friction or risk.");
    } else if (allSignals.length > 0) {
      sentences.push("The opportunity is showing steady, neutral activity.");
    }

    // 2. Look for Surges
    const surges = allSignals.filter(s => (s as AggregatedSignal).is_aggregated);
    if (surges.length > 0) {
      const latestSurge = surges[0];
      sentences.push(`A surge of ${latestSurge.signal_type.replace(' Surge', '')} events was recently detected.`);
    }

    // 3. Look for Anchor Signals (e.g. Budget, Requirements)
    const anchorSignals = activeSignals.filter(s => 
      s.signal_type.toLowerCase().includes('budget') || 
      s.signal_type.toLowerCase().includes('requirement') ||
      s.signal_category === SignalCategory.FIT
    );

    if (anchorSignals.length > 0) {
      sentences.push(`Key structural progress: ${anchorSignals[0].signal_type}.`);
    }

    // 4. Summarize Score Context
    if (currentMasterScore >= 80) {
      sentences.push("The combination of these signals and the high opportunity score suggests it is nearing closure.");
    } else if (currentMasterScore < 40 && totalImpact < 0) {
      sentences.push("Given the low baseline score, these negative signals indicate the deal is highly at risk.");
    }

    return sentences.join(" ");
  }
}
