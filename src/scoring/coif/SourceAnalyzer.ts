import { Lead, ReasonCode, SourceType } from './types';

export class SourceAnalyzer {
  public static analyze(lead: Lead): { sourceScore: number; reasons: ReasonCode[] } {
    let highestSourceScore = 0;
    const reasons: ReasonCode[] = [];

    const sourceWeights: Record<SourceType, number> = {
      'Government': 100,
      'Trade Data': 100,
      'Apollo': 80,
      'Marketplace': 70,
      'Website': 60,
      'Google Maps': 40,
      'Outscraper': 40,
      'Directory': 20,
    };

    lead.sources.forEach(source => {
      const score = sourceWeights[source] || 0;
      if (score > highestSourceScore) {
        highestSourceScore = score;
      }
    });

    if (highestSourceScore >= 80) {
      reasons.push({
        category: 'Confidence',
        description: `High confidence source detected: ${lead.sources.join(', ')}`,
        impact: '+20',
      });
    } else if (highestSourceScore <= 40) {
      reasons.push({
        category: 'Confidence',
        description: `Lower confidence source (e.g., Google Maps) requires more validation`,
        impact: '-10',
      });
    }

    return { sourceScore: highestSourceScore, reasons };
  }
}
