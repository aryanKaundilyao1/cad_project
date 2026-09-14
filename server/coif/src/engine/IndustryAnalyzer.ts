import { ClientContext, Lead, ReasonCode } from './types';

export class IndustryAnalyzer {
  public static analyze(client: ClientContext, lead: Lead): { multiplier: number; reasons: ReasonCode[] } {
    let multiplier = 1.0;
    const reasons: ReasonCode[] = [];

    const leadCategory = (lead.metrics.businessCategory || '').toLowerCase();
    const clientIndustry = client.industry.toLowerCase();

    if (leadCategory.includes(clientIndustry)) {
      multiplier += 0.2;
      reasons.push({
        category: 'Fit',
        description: `Direct industry match: ${client.industry}`,
        impact: '+20%',
      });
    } else {
      // Check for related but not direct match
      if (clientIndustry === 'ayurveda' && (leadCategory.includes('health') || leadCategory.includes('pharmacy'))) {
        multiplier += 0.1;
        reasons.push({
          category: 'Fit',
          description: `Related industry match (Ayurveda -> ${lead.metrics.businessCategory})`,
          impact: '+10%',
        });
      } else if (clientIndustry === 'rice' && (leadCategory.includes('food') || leadCategory.includes('grocery'))) {
        multiplier += 0.1;
        reasons.push({
          category: 'Fit',
          description: `Related industry match (Rice -> ${lead.metrics.businessCategory})`,
          impact: '+10%',
        });
      } else {
        multiplier -= 0.2;
        reasons.push({
          category: 'Fit',
          description: `Weak industry match between Client (${client.industry}) and Lead (${lead.metrics.businessCategory})`,
          impact: '-20%',
        });
      }
    }

    return { multiplier, reasons };
  }
}
