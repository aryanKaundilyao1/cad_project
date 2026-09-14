import { supabase } from "@/integrations/supabase/client";
import { SignalPriorityEngine, SignalPriority } from "./SignalPriorityEngine";
import { SignalUrgencyEngine, SignalUrgency } from "./SignalUrgencyEngine";
import { OpportunitySignalService } from "./OpportunitySignalService";
import { OpportunitySignal } from "./SignalTypes";

export class CriticalSignalService {
  /**
   * Scans across ALL opportunities for signals that demand immediate attention.
   * This is designed to feed the main CRM Dashboard.
   */
  static async scanForCriticalSignals(): Promise<OpportunitySignal[]> {
    // 1. Fetch all currently active/decaying signals globally (In a real system, limit this or use a background worker)
    const { data, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .in('status', ['Active', 'Decaying'])
      .order('detected_at', { ascending: false });

    if (error || !data) {
      console.error("Failed to scan critical signals", error);
      return [];
    }

    const rawSignals = data as OpportunitySignal[];
    const criticalSignals: OpportunitySignal[] = [];

    // 2. We need a way to look up master opportunity scores.
    // For performance, we would normally join this or cache it.
    // For this implementation, we will assume a baseline of 50 if unknown to prevent false positives.
    
    // In Phase 3B we persist scores in `master_opportunity_scores`.
    // We would fetch the latest score per opp.
    // Here we'll simulate the evaluation loop.

    for (const signal of rawSignals) {
      // Priority requires Master Score. (Simulating 50 as a default for global dashboard)
      const mockMasterScore = 50; 
      
      const priority = SignalPriorityEngine.calculatePriority(signal, mockMasterScore);
      const urgency = SignalUrgencyEngine.determineUrgency(signal, priority);

      if (priority === SignalPriority.CRITICAL || urgency === SignalUrgency.IMMEDIATE_ACTION) {
        criticalSignals.push(signal);
      }
    }

    return criticalSignals;
  }
}
