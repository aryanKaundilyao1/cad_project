import { supabase } from "@/integrations/supabase/client";
import { SignalStatus } from "./SignalEnums";
import { OpportunitySignal } from "./SignalTypes";
import { SignalLifecycleService } from "./SignalLifecycleService";

export class OpportunitySignalService {
  
  static async createSignal(signal: Partial<OpportunitySignal>): Promise<OpportunitySignal> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .insert(signal)
      .select()
      .single();
      
    if (error) throw error;
    return data as OpportunitySignal;
  }

  static async updateSignal(id: string, updates: Partial<OpportunitySignal>): Promise<OpportunitySignal> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as OpportunitySignal;
  }

  static async validateSignal(id: string): Promise<OpportunitySignal> {
    // In a real system, validation might check external APIs or rules engine
    return this.updateSignalStatus(id, SignalStatus.VALIDATED);
  }

  static async expireSignal(id: string): Promise<OpportunitySignal> {
    return this.updateSignalStatus(id, SignalStatus.EXPIRED);
  }

  static async archiveSignal(id: string): Promise<OpportunitySignal> {
    return this.updateSignalStatus(id, SignalStatus.ARCHIVED);
  }

  private static async updateSignalStatus(id: string, newStatus: SignalStatus): Promise<OpportunitySignal> {
    // Fetch current to validate transition
    const { data: current } = await supabase
      .from('opportunity_signals')
      .select('status')
      .eq('id', id)
      .single();
      
    if (current && !SignalLifecycleService.isValidTransition(current.status as SignalStatus, newStatus)) {
      throw new Error(`Invalid signal state transition from ${current.status} to ${newStatus}`);
    }

    const updates: any = { status: newStatus };
    if (newStatus === SignalStatus.EXPIRED || newStatus === SignalStatus.ARCHIVED) {
      updates.impact_score = 0; // Nullify impact when expired/archived
    }

    const { data, error } = await supabase
      .from('opportunity_signals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as OpportunitySignal;
  }

  static async getSignalsByOpportunity(opportunityId: string): Promise<OpportunitySignal[]> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data as OpportunitySignal[];
  }

  static async getActiveSignals(opportunityId: string): Promise<OpportunitySignal[]> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .in('status', [SignalStatus.ACTIVE, SignalStatus.DECAYING])
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data as OpportunitySignal[];
  }

  static async getHistoricalSignals(opportunityId: string): Promise<OpportunitySignal[]> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data as OpportunitySignal[];
  }

  static async getSignalsByContact(contactId: string): Promise<OpportunitySignal[]> {
    const { data, error } = await supabase
      .from('opportunity_signals')
      .select('*')
      .eq('contact_id', contactId)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data as OpportunitySignal[];
  }
}
