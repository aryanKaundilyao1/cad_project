import { ClientContext, Lead, ReasonCode } from './types';

export class ProductAnalyzer {
  public static analyze(client: ClientContext, lead: Lead): { score: number; reasons: ReasonCode[] } {
    let score = 0;
    const reasons: ReasonCode[] = [];

    const leadKeywords = lead.metrics.productKeywords || [];
    const leadDesc = (lead.metrics.businessDescription || '').toLowerCase();
    
    let matches = 0;
    client.targetProducts.forEach(product => {
      const p = product.toLowerCase();
      // Keyword match
      if (leadKeywords.map(k => k.toLowerCase()).includes(p)) {
        matches++;
        score += 30; // Direct catalog match
      }
      // Semantic / Description match
      else if (leadDesc.includes(p)) {
        matches++;
        score += 15;
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
