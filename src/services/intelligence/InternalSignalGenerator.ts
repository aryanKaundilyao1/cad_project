export interface RawEntity {
  id: string;
  type: 'lead' | 'project' | 'crm_activity' | 'company' | 'contact';
  data: any;
  source: string;
  timestamp: string;
}

export interface GeneratedSignal {
  signal_name: string;
  category: string;
  payload: any;
  confidence: number;
  reliability: string;
  raw_source: string;
}

export class InternalSignalGenerator {
  
  static generateFromEntity(entity: RawEntity): GeneratedSignal[] {
    const signals: GeneratedSignal[] = [];

    // Base reliability mapping based on source
    let reliability = 'medium';
    if (entity.source === 'Admin Entry' || entity.source === 'System Generated') {
      reliability = 'high';
    } else if (entity.source === 'CSV Upload') {
      reliability = 'medium';
    }

    if (entity.type === 'company' || entity.type === 'lead') {
      if (entity.data.website || entity.data.domain) {
        signals.push({
          signal_name: 'Website Present',
          category: 'Company Signals',
          payload: { website: entity.data.website || entity.data.domain },
          confidence: 100,
          reliability,
          raw_source: entity.source
        });
      }
      if (entity.data.phone) {
        signals.push({
          signal_name: 'Phone Present',
          category: 'Company Signals',
          payload: { phone: entity.data.phone },
          confidence: 100,
          reliability,
          raw_source: entity.source
        });
      }
      if (entity.data.industry || entity.data.category) {
        signals.push({
          signal_name: 'Industry Assigned',
          category: 'Company Signals',
          payload: { industry: entity.data.industry || entity.data.category },
          confidence: 100,
          reliability,
          raw_source: entity.source
        });
      }
    }

    if (entity.type === 'contact') {
      if (entity.data.title && entity.data.title.toLowerCase().includes('director') || entity.data.title?.toLowerCase().includes('ceo')) {
        signals.push({
          signal_name: 'Decision Maker Present',
          category: 'Contact Signals',
          payload: { title: entity.data.title },
          confidence: 100,
          reliability,
          raw_source: entity.source
        });
      }
    }

    if (entity.type === 'project' || entity.data.requirement) {
      signals.push({
        signal_name: 'Requirement Posted',
        category: 'Requirement Signals',
        payload: { description: entity.data.requirement || entity.data.title },
        confidence: 100,
        reliability,
        raw_source: entity.source
      });

      // Simple inference example
      if ((entity.data.requirement || entity.data.title)?.toLowerCase().includes('pep') || 
          (entity.data.requirement || entity.data.title)?.toLowerCase().includes('peb')) {
        signals.push({
          signal_name: 'PEB Requirement',
          category: 'Requirement Signals',
          payload: { inferred_from: entity.data.requirement || entity.data.title },
          confidence: 70, // Inferred, lower confidence
          reliability,
          raw_source: entity.source
        });
      }
    }

    if (entity.type === 'crm_activity') {
      signals.push({
        signal_name: `Lead ${entity.data.action || 'Assigned'}`,
        category: 'CRM Signals',
        payload: { action: entity.data.action, notes: entity.data.notes },
        confidence: 100,
        reliability,
        raw_source: entity.source
      });
    }

    return signals;
  }
}
