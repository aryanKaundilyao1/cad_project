import { BaseConnector, LeadPayload } from './BaseConnector';

export class PeopleDataLabsConnector extends BaseConnector {
  readonly sourceName = 'PeopleDataLabs';

  async fetchLeads(params: { company_name: string }): Promise<LeadPayload[]> {
    console.log(`[${this.sourceName}] Enriching company ${params.company_name} via PDL...`);
    
    const mockApiResponse = [
      {
        name: params.company_name,
        website: 'https://pdl-enriched.com',
        industry: 'Data Integration',
        location: { country: 'US' },
        id: 'pdl-uuid-123'
      }
    ];

    return mockApiResponse.map(result => this.normalize(result));
  }

  protected normalize(rawResult: any): LeadPayload {
    return {
      company_name: rawResult.name,
      website: rawResult.website,
      industry: rawResult.industry,
      country: rawResult.location?.country,
      source_id: rawResult.id,
      ...rawResult
    };
  }
}
