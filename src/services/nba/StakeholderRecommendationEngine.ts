import { supabase } from "@/integrations/supabase/client";

export class StakeholderRecommendationEngine {
  static async evaluate(opportunityId: string) {
    const recommendations = [];
    
    // Example rule: Check for missing Economic Buyer
    const { data: stakeholders } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('opportunity_id', opportunityId);
      
    const hasEconomicBuyer = stakeholders?.some(s => s.role === 'ECONOMIC_BUYER');
    
    if (!hasEconomicBuyer) {
      recommendations.push({
        type: 'ENGAGE_STAKEHOLDER',
        action: 'Identify and engage Economic Buyer',
        driver: 'MISSING_ROLE',
        evidence: {
          type: 'STAKEHOLDER',
          description: 'No stakeholder has been identified as the Economic Buyer'
        }
      });
    }

    return recommendations;
  }
}
