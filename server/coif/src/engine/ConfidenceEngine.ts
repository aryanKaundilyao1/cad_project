import { Lead, ReasonCode } from './types';

export class ConfidenceEngine {
  public static calculate(lead: Lead, sourceScore: number): { confidence: number; tier: 'High' | 'Medium' | 'Low'; reasons: ReasonCode[] } {
    const reasons: ReasonCode[] = [];
    
    // Base confidence starts from the normalized source score (0 - 100)
    let confidence = sourceScore;

    // Evaluate completeness
    let missingCriticalFields = 0;
    if (!lead.metrics.hasWebsite) missingCriticalFields++;
    if (!lead.metrics.hasPhone && !lead.metrics.hasEmail) missingCriticalFields++;
    if (!lead.metrics.businessCategory) missingCriticalFields++;

    if (missingCriticalFields > 0) {
      confidence -= (missingCriticalFields * 10);
      reasons.push({
        category: 'Confidence',
        description: `Missing ${missingCriticalFields} critical fields (Website, Contact info, Category)`,
        impact: `-${missingCriticalFields * 10}`,
      });
    } else {
      confidence += 10;
      reasons.push({
        category: 'Confidence',
        description: `High data completeness`,
        impact: '+10',
      });
    }

    // Agreement/Multi-source bonus
    if (lead.sources.length > 1) {
      confidence += (lead.sources.length * 5);
      reasons.push({
        category: 'Confidence',
        description: `Cross-validated across ${lead.sources.length} sources`,
        impact: `+${lead.sources.length * 5}`,
      });
    }

    confidence = Math.min(100, Math.max(0, confidence));

    let tier: 'High' | 'Medium' | 'Low' = 'Low';
    if (confidence >= 80) tier = 'High';
    else if (confidence >= 50) tier = 'Medium';

    return { confidence, tier, reasons };
  }
}
