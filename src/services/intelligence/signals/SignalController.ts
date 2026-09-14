import { OpportunitySignalService } from "./OpportunitySignalService";
import { OpportunitySignal } from "./SignalTypes";

/**
 * SignalController
 * Acts as the API facade for Signal Operations.
 * In a Node.js backend, this would map directly to Express routes.
 * In our React/Supabase architecture, these methods can be called directly by components or exposed via Edge Functions.
 */
export class SignalController {

  static async getSignalsByOpportunity(opportunityId: string): Promise<OpportunitySignal[]> {
    if (!opportunityId) throw new Error("Opportunity ID is required.");
    try {
      return await OpportunitySignalService.getHistoricalSignals(opportunityId);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to retrieve signals for opportunity.");
    }
  }

  static async getSignalsByContact(contactId: string): Promise<OpportunitySignal[]> {
    if (!contactId) throw new Error("Contact ID is required.");
    try {
      return await OpportunitySignalService.getSignalsByContact(contactId);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to retrieve signals for contact.");
    }
  }

  static async createSignal(payload: Partial<OpportunitySignal>): Promise<OpportunitySignal> {
    if (!payload.opportunity_id || !payload.signal_type || !payload.severity) {
      throw new Error("Missing required fields (opportunity_id, signal_type, severity)");
    }
    try {
      return await OpportunitySignalService.createSignal(payload);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to create signal.");
    }
  }

  static async updateSignal(signalId: string, updates: Partial<OpportunitySignal>): Promise<OpportunitySignal> {
    if (!signalId) throw new Error("Signal ID is required.");
    try {
      return await OpportunitySignalService.updateSignal(signalId, updates);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to update signal.");
    }
  }

  static async expireSignal(signalId: string): Promise<OpportunitySignal> {
    if (!signalId) throw new Error("Signal ID is required.");
    try {
      return await OpportunitySignalService.expireSignal(signalId);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to expire signal.");
    }
  }

  static async archiveSignal(signalId: string): Promise<OpportunitySignal> {
    if (!signalId) throw new Error("Signal ID is required.");
    try {
      return await OpportunitySignalService.archiveSignal(signalId);
    } catch (err: any) {
      console.error("SignalController Error:", err);
      throw new Error("Failed to archive signal.");
    }
  }
}
