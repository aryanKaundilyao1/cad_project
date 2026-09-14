import { BaseConnector, LeadPayload } from './BaseConnector';

export class TenderConnector extends BaseConnector {
  readonly sourceName = 'Tenders';

  async fetchLeads(params: { keywords: string; region: string }): Promise<LeadPayload[]> {
    console.log(`[${this.sourceName}] Fetching tenders for ${params.keywords} in ${params.region}...`);
    
    const mockApiResponse = [
      {
        agency_name: `Gov Department of ${params.region}`,
        portal_url: 'https://tenders.gov.example',
        contact_email: 'procurement@tenders.gov.example',
        tender_id: 'TND-2026-999',
        category: 'Public Works'
      }
    ];

    return mockApiResponse.map(result => this.normalize(result));
  }

  protected normalize(rawResult: any): LeadPayload {
    return {
      company_name: rawResult.agency_name,
      website: rawResult.portal_url,
      email: rawResult.contact_email,
      industry: rawResult.category,
      country: 'Unknown',
      source_id: rawResult.tender_id,
      ...rawResult
    };
  }
}
