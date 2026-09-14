import { ClientContext, Lead, ReasonCode } from './types';

export class ProductAnalyzer {
  public static analyze(client: ClientContext, lead: Lead): { score: number; reasons: ReasonCode[] } {
    let score = 0;
    const reasons: ReasonCode[] = [];

    const leadKeywords = lead.metrics.productKeywords || [];
    const leadDesc = (lead.metrics.businessDescription || '').toLowerCase();
    
    const leadKeywordsString = leadKeywords.join(' ').toLowerCase();
    
    let matches = 0;
    client.targetProducts.forEach(product => {
      const p = product.toLowerCase();
      // Partial semantic match in description or keywords
      if (leadKeywordsString.includes(p) || leadDesc.includes(p) || (lead.metrics.businessCategory || '').toLowerCase().includes(p)) {
        matches++;
        score += 30; // Direct catalog match
      } else {
        // Break product name into tokens and check if any meaningful token matches
        const tokens = p.split(' ').filter(t => t.length > 3);
        for (const token of tokens) {
          if (leadKeywordsString.includes(token) || leadDesc.includes(token)) {
            matches++;
            score += 15; // Partial Match
            break;
          }
        }
      }
    });

    if (matches > 0) {
      reasons.push({
        category: 'Fit',
        description: `Strong Product Match (${matches} products found in lead profile)`,
        impact: `+${score}`,
      });
    } else {
      reasons.push({
        category: 'Fit',
        description: `No direct product match found for client targets`,
        impact: '+0',
      });
    }

    return { score: Math.min(100, score), reasons };
  }
}
