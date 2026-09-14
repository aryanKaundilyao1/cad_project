import { BaseConnector } from "./BaseConnector";
import { MockGovernmentTenderConnector } from "./MockGovernmentTenderConnector";
import { ProviderRegistryService, SignalProvider } from "./ProviderRegistryService";
import { EventNormalizer } from "./EventNormalizer";
import { EntityResolver } from "./EntityResolver";
import { ExternalSignalGenerator } from "./ExternalSignalGenerator";
import { supabase } from "@/integrations/supabase/client";

export class ConnectorManager {
  
  static getConnectorInstance(provider: SignalProvider): BaseConnector {
    switch (provider.provider_type) {
      case 'mock_government_tender':
        return new MockGovernmentTenderConnector(provider.id, provider.configuration, provider.rate_limits);
      default:
        throw new Error(`Unsupported provider type: ${provider.provider_type}`);
    }
  }

  static async runSync(providerId: string): Promise<void> {
    const provider = await ProviderRegistryService.getProviderById(providerId);
    if (!provider) throw new Error("Provider not found");
    if (!provider.is_enabled) throw new Error("Provider is disabled");

    const connector = this.getConnectorInstance(provider);
    
    const { data: syncLog } = await supabase
      .from('provider_sync_logs')
      .insert({ provider_id: providerId, status: 'in_progress' })
      .select()
      .single();

    try {
      const startTime = Date.now();
      const rawEvents = await connector.sync(provider.last_sync ? new Date(provider.last_sync) : undefined);
      
      let recordsProcessed = 0;
      let recordsFailed = 0;

      for (const event of rawEvents) {
        // 1. Store Raw Event
        const { data: savedRawEvent, error } = await supabase
          .from('raw_external_events')
          .insert(event)
          .select()
          .single();
          
        if (error) {
          recordsFailed++;
          console.error(`Failed to store event: ${error.message}`);
          continue;
        }

        try {
          // 2. Normalize
          const stdEvent = EventNormalizer.normalize(
            savedRawEvent.id, 
            provider.provider_type, 
            savedRawEvent.event_type, 
            savedRawEvent.raw_payload,
            provider.id
          );

          // 3. Resolve Entity
          const companyId = await EntityResolver.resolveCompany(stdEvent.company_name);

          // 4. Generate Signal
          await ExternalSignalGenerator.generateSignal(stdEvent, companyId, provider.name);

          // Mark processed
          await supabase.from('raw_external_events').update({ 
            status: 'processed', 
            processed_at: new Date().toISOString() 
          }).eq('id', savedRawEvent.id);
          
          recordsProcessed++;

        } catch (pipelineErr: any) {
          recordsFailed++;
          await supabase.from('raw_external_events').update({ 
            status: 'failed', 
            error_message: pipelineErr.message 
          }).eq('id', savedRawEvent.id);
        }
      }

      const durationMs = Date.now() - startTime;
      await supabase.from('provider_sync_logs').update({
        status: recordsFailed === 0 ? 'success' : 'partial',
        ended_at: new Date().toISOString(),
        records_processed: recordsProcessed,
        records_failed: recordsFailed,
        duration_ms: durationMs
      }).eq('id', syncLog.id);

      await ProviderRegistryService.updateProvider(providerId, {
        last_sync: new Date().toISOString(),
        health_status: recordsFailed > 0 ? 'degraded' : 'healthy',
        error_count: 0
      });

    } catch (error: any) {
      await supabase.from('provider_sync_logs').update({
        status: 'failed',
        ended_at: new Date().toISOString(),
        error_details: error.message
      }).eq('id', syncLog.id);

      await ProviderRegistryService.updateProvider(providerId, {
        health_status: 'failing',
        error_count: provider.error_count + 1
      });
      
      throw error;
    }
  }
}
