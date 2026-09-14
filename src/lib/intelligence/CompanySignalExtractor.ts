import { BaseSignalExtractor, Signal } from "./BaseSignalExtractor";

export interface CompanyRecord {
  id: string;
  company_name: string;
  industry?: string;
  description?: string;
  enriched_data?: {
    employee_count?: number;
    locations_count?: number;
    funding_received?: boolean;
    recent_acquisitions?: boolean;
    [key: string]: any;
  };
  website_intelligence?: string;
}

export class CompanySignalExtractor extends BaseSignalExtractor<CompanyRecord> {
  constructor() {
    // 80% base confidence for company enrichment data, 90 days duplicate window (companies change slower)
    super("Company Enrichment", 80, 90); 
  }

  async extract(company: CompanyRecord): Promise<Signal[]> {
    const signals: Signal[] = [];
    const descLower = (company.description || '').toLowerCase();
    const websiteIntellLower = (company.website_intelligence || '').toLowerCase();
    const industryLower = (company.industry || '').toLowerCase();

    const combinedText = `${descLower} ${websiteIntellLower} ${industryLower}`;
    const enriched = company.enriched_data || {};

    // 1. Hiring Surge (Low)
    if (
      combinedText.includes('hiring') || 
      combinedText.includes('we are growing') ||
      (enriched.employee_count && enriched.employee_count > 500) // Placeholder logic for surge
    ) {
      signals.push({
        signal_type: 'Hiring Surge',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(70),
        signal_strength: 'Low',
        status: 'Active',
        company_id: company.id
      });
    }

    // 2. Capital Investment (Medium)
    if (
      enriched.funding_received || 
      combinedText.includes('raised series') || 
      combinedText.includes('venture capital') ||
      combinedText.includes('secured funding')
    ) {
      signals.push({
        signal_type: 'Capital Investment',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(90),
        signal_strength: 'Medium',
        status: 'Active',
        company_id: company.id
      });
    }

    // 3. Business Expansion (Medium)
    if (
      enriched.recent_acquisitions ||
      combinedText.includes('acquired') ||
      combinedText.includes('expanding footprint') ||
      combinedText.includes('entering new market')
    ) {
      signals.push({
        signal_type: 'Business Expansion',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(85),
        signal_strength: 'Medium',
        status: 'Active',
        company_id: company.id
      });
    }

    // 4. New Location (Medium)
    if (
      (enriched.locations_count && enriched.locations_count > 1) ||
      combinedText.includes('new office') ||
      combinedText.includes('new headquarters') ||
      combinedText.includes('global expansion')
    ) {
      signals.push({
        signal_type: 'New Location',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(80),
        signal_strength: 'Medium',
        status: 'Active',
        company_id: company.id
      });
    }

    // 5. Service Expansion (Medium)
    if (
      combinedText.includes('launched new product') ||
      combinedText.includes('new service offering') ||
      combinedText.includes('introducing')
    ) {
      signals.push({
        signal_type: 'Service Expansion',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(75),
        signal_strength: 'Medium',
        status: 'Active',
        company_id: company.id
      });
    }

    // 6. Vendor Registration (Medium)
    if (
      combinedText.includes('registered vendor') ||
      combinedText.includes('empanelled with') ||
      combinedText.includes('certified partner')
    ) {
      signals.push({
        signal_type: 'Vendor Registration',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(80),
        signal_strength: 'Medium',
        status: 'Active',
        company_id: company.id
      });
    }

    return signals;
  }
}
