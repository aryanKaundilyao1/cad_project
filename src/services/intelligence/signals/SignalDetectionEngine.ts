import { supabase } from "@/integrations/supabase/client";
import { SignalValidationService } from "./SignalValidationService";
import { OpportunitySignalService } from "./OpportunitySignalService";
import { SignalStatus, SignalConfidence, SignalSeverity, SignalCategory } from "./SignalEnums";
import { OpportunitySignal, OpportunitySignalDefinition } from "./SignalTypes";

export interface EventPayload {
  eventName: string; // e.g. 'MEETING_LOGGED', 'TASK_OVERDUE_7D'
  opportunityId: string;
  contactId?: string;
  source: string;
  evidence: any;
}

export class SignalDetectionEngine {
  
  /**
   * Main entrypoint for detecting signals based on CRM events.
   * In a production environment, this would listen to an event bus or webhook.
   */
  static async processEvent(payload: EventPayload): Promise<OpportunitySignal | null> {
    // 1. Find a matching Signal Definition
    const { data: defs, error } = await supabase
      .from('opportunity_signal_definitions')
      .select('*')
      .eq('name', payload.eventName)
      .eq('is_active', true)
      .limit(1);

    if (error || !defs || defs.length === 0) {
      // 1b. Fallback Logic: Detect Opportunity Stage Changes (False Negative Fix)
      // If the event is a known core milestone but missing a DB definition, construct a hardcoded one.
      if (payload.eventName === 'OPPORTUNITY_STAGE_CHANGED') {
        const milestoneDef: OpportunitySignalDefinition = {
          id: 'sys_stage_change',
          name: 'Opportunity Stage Advanced',
          description: 'The opportunity progressed to the next stage.',
          category: SignalCategory.FIT, // Structural progress
          default_impact: 15.0,
          default_confidence: SignalConfidence.HIGH,
          default_severity: SignalSeverity.MEDIUM,
          default_expiration_days: 90,
          is_active: true,
          created_at: new Date().toISOString()
        };
        return await this.createFromDefinition(payload, milestoneDef);
      }
      
      console.warn(`No active signal definition found for event: ${payload.eventName}`);
      return null;
    }

    const definition = defs[0] as OpportunitySignalDefinition;
    return await this.createFromDefinition(payload, definition);
  }

  private static async createFromDefinition(payload: EventPayload, definition: OpportunitySignalDefinition): Promise<OpportunitySignal | null> {

    // 2. Calculate Expiration Dates
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + definition.default_expiration_days);
    
    // Decay starts at half-life of expiration
    const decayStart = new Date();
    decayStart.setDate(now.getDate() + Math.floor(definition.default_expiration_days / 2));

    // 3. Construct Candidate Signal
    const candidate: Partial<OpportunitySignal> = {
      opportunity_id: payload.opportunityId,
      contact_id: payload.contactId,
      definition_id: definition.id,
      signal_type: definition.name,
      signal_category: definition.category,
      severity: definition.default_severity,
      confidence: definition.default_confidence,
      impact_score: definition.default_impact,
      source: payload.source,
      evidence: payload.evidence,
      detected_at: now.toISOString(),
      decay_start: decayStart.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: SignalStatus.ACTIVE
    };

    // 4. Validate Candidate
    const validation = SignalValidationService.validateCandidate(candidate);
    if (!validation.valid) {
      console.error(`Signal validation failed for ${payload.eventName}: ${validation.reason}`);
      return null;
    }

    // 5. Persist
    try {
      const createdSignal = await OpportunitySignalService.createSignal(candidate);
      return createdSignal;
    } catch (e) {
      console.error(`Failed to persist signal ${payload.eventName}`, e);
      return null;
    }
  }
}
