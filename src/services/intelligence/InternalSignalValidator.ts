import { GeneratedSignal } from './InternalSignalGenerator';
import { SignalService, SignalDefinition } from '../SignalService';

export class InternalSignalValidator {
  
  private static cachedDefinitions: SignalDefinition[] = [];
  
  static async loadDefinitions() {
    if (this.cachedDefinitions.length === 0) {
      this.cachedDefinitions = await SignalService.getSignalDefinitions();
    }
  }

  static async validate(signals: GeneratedSignal[]): Promise<(GeneratedSignal & { signal_definition_id: string })[]> {
    await this.loadDefinitions();
    
    const validated: (GeneratedSignal & { signal_definition_id: string })[] = [];

    for (const sig of signals) {
      // Find matching definition
      let def = this.cachedDefinitions.find(d => d.name === sig.signal_name);
      
      if (!def) {
        // Auto-create missing definitions for the internal engine
        def = await SignalService.createSignalDefinition({
          name: sig.signal_name,
          category: sig.category,
          weight_tier: 'Tier 3',
          base_weight: 5
        });
        this.cachedDefinitions.push(def);
      }
      
      validated.push({
        ...sig,
        signal_definition_id: def.id
      });
    }

    return validated;
  }
}
