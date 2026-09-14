export interface RawExternalEvent {
  provider_id: string;
  event_type: string;
  raw_payload: any;
  status: 'pending' | 'processed' | 'failed';
  error_message?: string;
}

export abstract class BaseConnector {
  protected providerId: string;
  protected config: any;
  protected rateLimits: any;

  constructor(providerId: string, config: any, rateLimits: any) {
    this.providerId = providerId;
    this.config = config;
    this.rateLimits = rateLimits;
  }

  /**
   * Used to authenticate with the provider API.
   * Throws an error if authentication fails.
   */
  abstract authenticate(): Promise<void>;

  /**
   * Fetches the latest raw events from the provider.
   * Should handle rate limiting and pagination internally.
   */
  abstract fetchRawEvents(since?: Date): Promise<any[]>;

  /**
   * Normalizes the specific payload format from this provider 
   * into the standard RawExternalEvent structure before saving to DB.
   */
  protected abstract formatRawEvent(payload: any, eventType: string): RawExternalEvent;
  
  /**
   * Orchestrates the fetch and format process.
   */
  async sync(since?: Date): Promise<RawExternalEvent[]> {
    await this.authenticate();
    const payloads = await this.fetchRawEvents(since);
    
    return payloads.map(payload => 
      this.formatRawEvent(payload, this.determineEventType(payload))
    );
  }

  /**
   * Allows the connector to specify the event type based on the raw payload.
   */
  protected abstract determineEventType(payload: any): string;
}
