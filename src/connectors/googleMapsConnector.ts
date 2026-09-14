import { BaseConnector, LeadPayload } from './BaseConnector';

export class GoogleMapsConnector extends BaseConnector {
  readonly sourceName = 'GoogleMaps';

  async fetchLeads(params: { industry: string; location: string; keywords?: string }): Promise<LeadPayload[]> {
    console.log(`[${this.sourceName}] Fetching leads for ${params.industry} in ${params.location}...`);
    
    // In a real implementation, this would hit Outscraper API, Apify Actor, or BrightData.
    // For now, we mock the response or call a Supabase Edge Function that handles the API keys securely.
    
    // Mocking Outscraper/Apify response
    const mockApiResponse = [
      {
        query: `${params.industry} in ${params.location}`,
        name: `Acme ${params.industry} Co.`,
        site: 'https://acme.example.com',
        emails: ['contact@acme.example.com'],
        phone: '+1-555-0199',
        type: params.industry,
        country: 'US',
        place_id: `ChIJ_${Math.random().toString(36).substring(7)}`
      }
    ];

    return mockApiResponse.map(result => this.normalize(result));
  }

  protected normalize(rawResult: any): LeadPayload {
    return {
      company_name: rawResult.name,
      website: rawResult.site,
      email: rawResult.emails && rawResult.emails.length > 0 ? rawResult.emails[0] : undefined,
      phone: rawResult.phone,
      industry: rawResult.type,
      country: rawResult.country,
      source_id: rawResult.place_id,
      ...rawResult // preserve original payload
    };
  }
}
