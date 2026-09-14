import { supabase } from "@/integrations/supabase/client";
import { SignalStatus } from "./SignalEnums";
import { SignalLifecycleService } from "./SignalLifecycleService";
import { OpportunitySignalService } from "./OpportunitySignalService";

export class SignalExpirationService {
  /**
   * Intended to be run periodically (e.g., cron job or queue).
   * Checks all Active and Decaying signals and updates their state if timestamps have passed.
   */
  static async processExpirations(): Promise<number> {
    let processedCount = 0;

    // Fetch signals that might need transition
    const { data: signals, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .in('status', [SignalStatus.ACTIVE, SignalStatus.DECAYING]);

    if (error) {
      console.error('Failed to fetch signals for expiration processing', error);
      return processedCount;
    }

    for (const signal of signals) {
      const nextStatus = SignalLifecycleService.evaluateTimeBasedTransitions(signal);
      
      if (nextStatus !== signal.status) {
        try {
          if (nextStatus === SignalStatus.EXPIRED) {
            await OpportunitySignalService.expireSignal(signal.id);
          } else {
            // General update for DECAYING
            await OpportunitySignalService.updateSignal(signal.id, { status: nextStatus });
          }
          processedCount++;
        } catch (err) {
          console.error(`Failed to process transition for signal ${signal.id}`, err);
        }
      }
    }

    return processedCount;
  }
}
