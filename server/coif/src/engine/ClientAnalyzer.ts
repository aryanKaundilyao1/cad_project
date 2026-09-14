import { ClientContext, Lead, ReasonCode } from './types';

export class ClientAnalyzer {
  public static analyze(client: ClientContext, lead: Lead): { score: number; reasons: ReasonCode[] } {
    let score = 50; // Base score
    const reasons: ReasonCode[] = [];

    // Market Fit (Country)
    if (lead.metrics.country && client.targetCountries.includes(lead.metrics.country)) {
      score += 20;
      reasons.push({
        category: 'Fit',
        description: `Market Match (Lead is in target country: ${lead.metrics.country})`,
        impact: '+20',
      });
    } else if (lead.metrics.country) {
      score -= 20;
      reasons.push({
        category: 'Fit',
        description: `Lead country (${lead.metrics.country}) is outside target markets`,
        impact: '-20',
      });
    }

    // Certifications
    let certMatches = 0;
    if (client.requiredCertifications.length > 0) {
      const leadCerts = lead.metrics.certificates || [];
      client.requiredCertifications.forEach(cert => {
        if (leadCerts.includes(cert)) {
          certMatches++;
        }
      });

      if (certMatches === client.requiredCertifications.length) {
        score += 30;
        reasons.push({
          category: 'Fit',
          description: `All required certifications met`,
          impact: '+30',
        });
      } else if (certMatches > 0) {
        score += 10;
        reasons.push({
          category: 'Fit',
          description: `Some required certifications met (${certMatches}/${client.requiredCertifications.length})`,
          impact: '+10',
        });
      } else {
        score -= 10;
        reasons.push({
          category: 'Fit',
          description: `Missing required certifications`,
          impact: '-10',
        });
      }
    }

    return { score: Math.min(100, Math.max(0, score)), reasons };
  }
}
