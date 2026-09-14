import { supabase } from "@/integrations/supabase/client";

export type SignalStrength = 'Low' | 'Medium' | 'High' | 'Critical';
export type SignalStatus = 'Active' | 'Expired' | 'Converted' | 'Dismissed';

export interface Signal {
  id?: string;
  signal_type: string;
  signal_source: string;
  confidence_score: number;
  signal_strength: SignalStrength;
  status?: SignalStatus;
  detected_at?: Date;
  expires_at?: Date;
  raw_payload?: Record<string, any>;
  company_id?: string;
  project_id?: string;
  tender_id?: string;
}

export abstract class BaseSignalExtractor<TRawInput = any> {
  protected sourceName: string;
  protected baseConfidenceWeight: number;
  protected duplicateWindowDays: number; // Prevent duplicate signals within this window

  constructor(sourceName: string, baseConfidenceWeight: number = 100, duplicateWindowDays: number = 30) {
    this.sourceName = sourceName;
    this.baseConfidenceWeight = baseConfidenceWeight;
    this.duplicateWindowDays = duplicateWindowDays;
  }

  /**
   * Abstract method to be implemented by specific extractors (e.g. Tender, Project, News)
   */
  abstract extract(rawPayload: TRawInput): Promise<Signal[]>;

  /**
   * Validates if the signal meets basic taxonomy rules before insertion
   */
  validate(signal: Partial<Signal>): boolean {
    if (!signal.signal_type || !signal.signal_source) return false;
    if (signal.confidence_score === undefined || signal.confidence_score < 0 || signal.confidence_score > 100) return false;
    return true;
  }

  /**
   * Calculates final confidence combining source reliability and extraction confidence
   */
  calculateConfidence(extractionConfidence: number): number {
    return Math.round((this.baseConfidenceWeight * extractionConfidence) / 100);
  }

  /**
   * Checks if an identical signal was created within the duplicate window
   */
  async checkForDuplicates(signalData: Signal): Promise<string | null> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.duplicateWindowDays);

    let query = supabase
      .from('signals')
      .select('id, detected_at')
      .eq('signal_type', signalData.signal_type)
      .eq('signal_source', this.sourceName)
      .gte('detected_at', cutoffDate.toISOString());

    if (signalData.company_id) {
      // Need to join company_signals
      const { data } = await supabase
        .from('company_signals')
        .select(`
          signal_id,
          signals!inner(id, signal_type, signal_source, detected_at)
        `)
        .eq('company_id', signalData.company_id)
        .eq('signals.signal_type', signalData.signal_type)
        .eq('signals.signal_source', this.sourceName)
        .gte('signals.detected_at', cutoffDate.toISOString())
        .limit(1);
      
      if (data && data.length > 0) return data[0].signal_id;
    } 
    
    if (signalData.project_id) {
      const { data } = await supabase
        .from('project_signals')
        .select(`
          signal_id,
          signals!inner(id, signal_type, signal_source, detected_at)
        `)
        .eq('project_id', signalData.project_id)
        .eq('signals.signal_type', signalData.signal_type)
        .eq('signals.signal_source', this.sourceName)
        .gte('signals.detected_at', cutoffDate.toISOString())
        .limit(1);
      
      if (data && data.length > 0) return data[0].signal_id;
    }

    if (signalData.tender_id) {
      const { data } = await supabase
        .from('tender_signals')
        .select(`
          signal_id,
          signals!inner(id, signal_type, signal_source, detected_at)
        `)
        .eq('tender_id', signalData.tender_id)
        .eq('signals.signal_type', signalData.signal_type)
        .eq('signals.signal_source', this.sourceName)
        .gte('signals.detected_at', cutoffDate.toISOString())
        .limit(1);
      
      if (data && data.length > 0) return data[0].signal_id;
    }

    return null;
  }

  /**
   * Creates the signal in the database and links to corresponding entities
   */
  async createSignal(signalData: Signal): Promise<string | null> {
    if (!this.validate(signalData)) {
      console.warn(`Signal validation failed for ${signalData.signal_type}`);
      return null;
    }

    try {
      // 1. Check for duplicates
      const existingSignalId = await this.checkForDuplicates(signalData);
      if (existingSignalId) {
        // We could update the 'detected_at' or confidence score here, but for now we'll just log prevention
        console.log(`Duplicate prevented: Signal ${signalData.signal_type} already exists for this entity.`);
        // Optionally log duplicate event
        // await this.logEvent(existingSignalId, 'Duplicate Prevented', 'Ignored identical signal within window.');
        return existingSignalId;
      }

      // 2. Insert into signals table
      const { data: signal, error: signalError } = await supabase
        .from('signals')
        .insert({
          signal_type: signalData.signal_type,
          signal_source: this.sourceName,
          confidence_score: signalData.confidence_score,
          signal_strength: signalData.signal_strength,
          status: signalData.status || 'Active',
          expires_at: signalData.expires_at ? signalData.expires_at.toISOString() : null,
          raw_payload: signalData.raw_payload || {}
        })
        .select('id')
        .single();

      if (signalError) throw signalError;
      const signalId = signal.id;

      // 3. Link to entities
      if (signalData.company_id) {
        await supabase.from('company_signals').insert({
          company_id: signalData.company_id,
          signal_id: signalId
        });
      }
      
      if (signalData.project_id) {
        await supabase.from('project_signals').insert({
          project_id: signalData.project_id,
          signal_id: signalId
        });
      }

      if (signalData.tender_id) {
        await supabase.from('tender_signals').insert({
          tender_id: signalData.tender_id,
          signal_id: signalId
        });
      }

      // Note: Triggers automatically handle the 'Created' audit log event
      return signalId;

    } catch (error) {
      console.error(`Error creating signal:`, error);
      return null;
    }
  }

  /**
   * Manual event logging if needed outside the automatic triggers
   */
  async logEvent(signalId: string, eventType: string, reason: string, oldState: any = null, newState: any = null) {
    try {
      const { error } = await supabase.from('signal_events').insert({
        signal_id: signalId,
        event_type: eventType,
        reason: reason,
        old_state: oldState,
        new_state: newState
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to log signal event', error);
    }
  }

  /**
   * Process an array of signals
   */
  async processSignals(signals: Signal[]): Promise<string[]> {
    const createdIds: string[] = [];
    for (const sig of signals) {
      const id = await this.createSignal(sig);
      if (id) createdIds.push(id);
    }
    return createdIds;
  }
}
