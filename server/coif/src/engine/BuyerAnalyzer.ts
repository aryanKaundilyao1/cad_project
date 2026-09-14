import { ClientContext, Lead, ReasonCode } from './types';

export class BuyerAnalyzer {
  public static analyze(client: ClientContext, lead: Lead): { multiplier: number; reasons: ReasonCode[] } {
    let multiplier = 1.0;
    const reasons: ReasonCode[] = [];

    const m = lead.metrics;
    
    // Attempt to infer buyer type from metrics if not explicitly set
    let inferredTypes: string[] = [];
    if (m.wholesaleMention) inferredTypes.push('Wholesaler');
    if (m.privateLabelMention) inferredTypes.push('Private Label');
    if (m.oemMention) inferredTypes.push('OEM');
    if (m.businessCategory?.toLowerCase().includes('importer')) inferredTypes.push('Importer');

    let matched = false;
    inferredTypes.forEach(t => {
      if (client.targetBuyerTypes.includes(t)) {
        matched = true;
      }
    });

    if (matched) {
      multiplier += 0.3;
      reasons.push({
        category: 'Fit',
        description: `High Buyer Fit (Identified as target buyer type: ${inferredTypes.join(', ')})`,
        impact: '+30%',
      });
    } else if (inferredTypes.length > 0) {
       reasons.push({
        category: 'Fit',
        description: `Identified as ${inferredTypes.join(', ')} but client is not explicitly targeting this`,
        impact: '0%',
      });
    } else {
       reasons.push({
        category: 'Fit',
        description: `Could not verify specific buyer type from observable metrics`,
        impact: '0%',
      });
    }

    return { multiplier, reasons };
  }
}
