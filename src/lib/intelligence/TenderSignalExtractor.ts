import { BaseSignalExtractor, Signal } from "./BaseSignalExtractor";

export interface TenderRecord {
  id: string;
  tender_title: string;
  authority?: string;
  department?: string;
  raw_description?: string;
  category?: string;
  estimated_value?: number;
  submission_date?: string | Date;
}

export class TenderSignalExtractor extends BaseSignalExtractor<TenderRecord> {
  constructor() {
    // 95% base confidence for CPPP Tenders, 7 days duplicate window
    super("CPPP Tenders", 95, 7); 
  }

  async extract(tender: TenderRecord): Promise<Signal[]> {
    const signals: Signal[] = [];
    const titleLower = (tender.tender_title || '').toLowerCase();
    const descLower = (tender.raw_description || '').toLowerCase();
    const catLower = (tender.category || '').toLowerCase();
    const authorityLower = (tender.authority || '').toLowerCase();
    const deptLower = (tender.department || '').toLowerCase();

    const combinedText = `${titleLower} ${descLower} ${catLower} ${authorityLower} ${deptLower}`;

    // 1. Tender Published (Critical - applies to almost all new tenders)
    signals.push({
      signal_type: 'Tender Published',
      signal_source: this.sourceName,
      confidence_score: this.calculateConfidence(100),
      signal_strength: 'Critical',
      status: 'Active',
      tender_id: tender.id,
      expires_at: tender.submission_date ? new Date(tender.submission_date) : undefined,
      raw_payload: {
        title: tender.tender_title,
        authority: tender.authority,
        value: tender.estimated_value
      }
    });

    // 2. Vendor Registration
    if (
      combinedText.includes('empanelment') || 
      combinedText.includes('vendor registration') || 
      combinedText.includes('pre-qualification')
    ) {
      signals.push({
        signal_type: 'Vendor Registration',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(90),
        signal_strength: 'Medium',
        status: 'Active',
        tender_id: tender.id,
        expires_at: tender.submission_date ? new Date(tender.submission_date) : undefined
      });
    }

    // 3. Contract Award
    if (
      titleLower.includes('award of') || 
      titleLower.includes('awarded') || 
      combinedText.includes('contract award') ||
      combinedText.includes('selected bidder')
    ) {
      signals.push({
        signal_type: 'Contract Award',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(95),
        signal_strength: 'High',
        status: 'Active',
        tender_id: tender.id
      });
    }

    // 4. Infrastructure Procurement
    if (
      catLower.includes('civil works') || 
      catLower.includes('infrastructure') ||
      titleLower.includes('construction of') ||
      titleLower.includes('development of')
    ) {
      signals.push({
        signal_type: 'Infrastructure Procurement',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(85),
        signal_strength: 'High',
        status: 'Active',
        tender_id: tender.id,
        expires_at: tender.submission_date ? new Date(tender.submission_date) : undefined
      });
    }

    // 5. Industrial Procurement
    if (
      catLower.includes('machinery') || 
      catLower.includes('industrial') ||
      authorityLower.includes('industrial') ||
      deptLower.includes('industry') ||
      combinedText.includes('factory') ||
      combinedText.includes('manufacturing')
    ) {
      signals.push({
        signal_type: 'Industrial Procurement',
        signal_source: this.sourceName,
        confidence_score: this.calculateConfidence(85),
        signal_strength: 'High',
        status: 'Active',
        tender_id: tender.id,
        expires_at: tender.submission_date ? new Date(tender.submission_date) : undefined
      });
    }

    return signals;
  }
}
