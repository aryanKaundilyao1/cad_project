import { BaseConnector, RawExternalEvent } from "./BaseConnector";

export class MockGovernmentTenderConnector extends BaseConnector {
  
  async authenticate(): Promise<void> {
    // Simulate API Auth
    console.log(`[MockGovernmentTenderConnector] Authenticated with API key: ${this.config.api_key ? '***' : 'none'}`);
  }

  async fetchRawEvents(since?: Date): Promise<any[]> {
    // Return mock government tender data
    return [
      {
        tender_id: "TND-2026-8812",
        issuer: "Gov Dept of Infrastructure",
        awarded_to: "ABC Steel Pvt Ltd",
        value_usd: 150000,
        published_date: new Date().toISOString(),
        category: "Construction Materials",
        url: "https://tenders.gov/TND-2026-8812"
      },
      {
        tender_id: "TND-2026-8815",
        issuer: "Ministry of Transport",
        awarded_to: "XYZ Engineering Solutions",
        value_usd: 85000,
        published_date: new Date().toISOString(),
        category: "Bridge Expansion",
        url: "https://tenders.gov/TND-2026-8815"
      }
    ];
  }

  protected determineEventType(payload: any): string {
    return "Tender_Awarded";
  }

  protected formatRawEvent(payload: any, eventType: string): RawExternalEvent {
    return {
      provider_id: this.providerId,
      event_type: eventType,
      raw_payload: payload,
      status: 'pending'
    };
  }
}
