import { BaseConnector, LeadPayload } from './BaseConnector';

export class TradeDirectoryConnector extends BaseConnector {
  readonly sourceName = 'TradeDirectory';

  async fetchLeads(params: { industry: string; directory: 'IndiaMART' | 'TradeIndia' | 'ExportersIndia' | 'Kompass' | 'ThomasNet' }): Promise<LeadPayload[]> {
    console.log(`[${this.sourceName}] Scraping ${params.directory} for ${params.industry}...`);
    
    // Mock scraping/API response
    
    const mockApiResponse = [
      {
        supplier_name: `${params.directory} Supplier Ltd.`,
        supplier_url: `https://www.${params.directory.toLowerCase()}.com/supplier/123`,
        contact_email: `sales@${params.directory.toLowerCase()}-supplier.com`,
        contact_number: '+91 9876543210',
        category: params.industry,
        country: 'India',
        directory_id: 'SUP-12345'
      }
    ];

    return mockApiResponse.map(result => this.normalize(result));
  }

  protected normalize(rawResult: any): LeadPayload {
    return {
      company_name: rawResult.supplier_name,
      website: rawResult.supplier_url,
      email: rawResult.contact_email,
      phone: rawResult.contact_number,
      industry: rawResult.category,
      country: rawResult.country,
      source_id: rawResult.directory_id,
      ...rawResult
    };
  }
}
