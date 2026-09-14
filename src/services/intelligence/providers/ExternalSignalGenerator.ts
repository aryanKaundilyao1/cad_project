import { StandardExternalEvent } from "./EventNormalizer";
import { SignalService } from "../../SignalService";

export class ExternalSignalGenerator {
  /**
   * Maps a standard external event to the Signal Registry and persists it to the event store.
   */
  static async generateSignal(standardEvent: StandardExternalEvent, companyId: string, providerName: string): Promise<void> {
    
    // 1. Get or Create Signal Definition in the Registry
    let { data: definition } = await SignalService.getBaseQuery('signal_definitions')
      .select('id')
      .eq('name', standardEvent.signal_type)
      .maybeSingle();

    if (!definition) {
      const newDef = await SignalService.createSignalDefinition({
        name: standardEvent.signal_type,
        category: 'External Intelligence',
        weight_tier: 'Tier 3',
        base_weight: 5
      });
      definition = { id: newDef.id };
    }

    // 2. Persist to Signal Event Store
    await SignalService.recordSignalEvent({
      company_id: companyId,
      signal_definition_id: definition.id,
      payload: standardEvent.metadata,
      raw_source: `Provider: ${providerName}`,
      confidence: standardEvent.confidence,
      reliability: 'medium' // Standard for external data unless validated
    });
  }
}
