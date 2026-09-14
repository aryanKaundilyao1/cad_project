import { BaseDataConnector } from "./BaseDataConnector";
import { FetchDataParams } from "./types";

export interface OutscraperParams extends FetchDataParams {
  query: string; // e.g. "Warehouses Delhi NCR"
  limit?: number;
}

export class GoogleMapsConnector extends BaseDataConnector<any, any> {
  private apiKey: string;
  private endpoint = "https://api.outscraper.com/maps/search-v3";

  constructor(sourceId: string, apiKey: string) {
    super(sourceId, 'lead');
    this.apiKey = apiKey;
  }

  async authenticate(): Promise<boolean> {
    if (!this.apiKey) return false;
    // Outscraper doesn't have a pure "auth check" endpoint, so we assume true if key exists.
    return true;
  }

  async fetchData(params: OutscraperParams): Promise<{ data: any[]; nextCursor?: string | undefined }> {
    const url = new URL(this.endpoint);
    url.searchParams.append('query', params.query);
    url.searchParams.append('limit', (params.limit || 20).toString());
    url.searchParams.append('async', 'false'); // For testing we wait synchronously

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Outscraper API Error (${response.status}): ${errText}`);
    }

    const json = await response.json();
    
    // Outscraper wraps results in an array of arrays if multiple queries are sent
    const results = json.data && json.data.length > 0 ? json.data[0] : [];
    
    return { data: results };
  }

  transform(rawData: any): any {
    // Map Outscraper fields to our JAS CONNECT raw_leads schema
    return {
      company_name: rawData.name || '',
      phone: rawData.phone || '',
      email: (rawData.emails && rawData.emails.length > 0) ? rawData.emails[0] : (rawData.email_1 || ''),
      website: rawData.site || '',
      city: rawData.city || rawData.state || '',
      source: 'Google Maps Connector',
      raw_json: rawData // Stored for future Signal Generation
    };
  }
}
