import { OpportunitySignalService } from "./OpportunitySignalService";
import { OpportunitySignalTimelineBuilder, TimelineGroup } from "./OpportunitySignalTimelineBuilder";
import { SignalPriorityEngine, SignalPriority } from "./SignalPriorityEngine";
import { SignalUrgencyEngine, SignalUrgency } from "./SignalUrgencyEngine";
import { SignalStoryEngine } from "./SignalStoryEngine";
import { CriticalSignalService } from "./CriticalSignalService";

export interface SignalFeedResponse {
  timeline: TimelineGroup[];
  story: string;
  activeCount: number;
  criticalCount: number;
}

export class OpportunitySignalFeed {
  
  /**
   * Generates the complete, intelligent feed for a specific opportunity.
   */
  static async getFeed(opportunityId: string, currentMasterScore: number = 50): Promise<SignalFeedResponse> {
    
    // 1. Fetch raw signals
    const signals = await OpportunitySignalService.getSignalsByOpportunity(opportunityId);
    
    // 2. Build Timeline (which also Aggregates)
    const timeline = OpportunitySignalTimelineBuilder.build(signals);
    
    // 3. Generate Narrative Story
    const story = SignalStoryEngine.generateNarrative(timeline, currentMasterScore);
    
    // 4. Calculate Stats
    let activeCount = 0;
    let criticalCount = 0;
    
    for (const signal of signals) {
      if (signal.status === 'Active' || signal.status === 'Decaying') {
        activeCount++;
        
        const priority = SignalPriorityEngine.calculatePriority(signal, currentMasterScore);
        const urgency = SignalUrgencyEngine.determineUrgency(signal, priority);
        
        if (priority === SignalPriority.CRITICAL || urgency === SignalUrgency.IMMEDIATE_ACTION) {
          criticalCount++;
        }
      }
    }
    
    return {
      timeline,
      story,
      activeCount,
      criticalCount
    };
  }

  /**
   * Retrieves globally critical signals for the dashboard.
   */
  static async getGlobalCriticalFeed() {
    return await CriticalSignalService.scanForCriticalSignals();
  }
}
