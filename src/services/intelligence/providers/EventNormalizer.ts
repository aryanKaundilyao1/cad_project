export interface StandardExternalEvent {
  event_id: string; // internal UUID from raw_external_events
  provider_id: string;
  signal_type: string;
  company_name: string;
  event_date: string;
  confidence: number;
  metadata: any;
}

export class EventNormalizer {
  /**
   * Translates an arbitrary JSON payload from a specific provider type 
   * into a StandardExternalEvent.
   */
  static normalize(rawEventId: string, providerType: string, eventType: string, payload: any, providerId: string): StandardExternalEvent {
    switch (providerType) {
      case 'mock_government_tender':
        return this.normalizeMockTender(rawEventId, payload, providerId);
      // Add more cases for different provider types (e.g. panjiva, bombora)
      default:
        throw new Error(`No normalizer defined for provider type: ${providerType}`);
    }
  }

  private static normalizeMockTender(eventId: string, payload: any, providerId: string): StandardExternalEvent {
    // The payload looks like { awarded_to: "ABC Steel", category: "...", published_date: "..." }
    return {
      event_id: eventId,
      provider_id: providerId,
      signal_type: "Government Tender Awarded",
      company_name: payload.awarded_to,
      event_date: payload.published_date,
      confidence: 90, // High confidence for government data
      metadata: {
        tender_id: payload.tender_id,
        issuer: payload.issuer,
        category: payload.category,
        value_usd: payload.value_usd,
        source_url: payload.url
      }
    };
  }
}
