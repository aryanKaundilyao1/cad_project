import { supabase } from "@/integrations/supabase/client";

export class OpportunityAnalyticsService {
  
  static async getDashboardMetrics() {
    const { data: scores, error } = await supabase
      .from('opportunity_scores')
      .select('fit_score, intent_score, timing_score, engagement_score, final_score');
      
    if (error) throw error;
    if (!scores || scores.length === 0) {
      return {
        avgFit: 0,
        avgIntent: 0,
        avgTiming: 0,
        avgEngagement: 0,
        avgOpportunity: 0,
        totalOpportunities: 0
      };
    }
    
    const count = scores.length;
    const sum = (key: string) => scores.reduce((acc, curr) => acc + (curr[key as keyof typeof curr] || 0), 0);
    
    return {
      avgFit: Math.round((sum('fit_score') / count) * 10) / 10,
      avgIntent: Math.round((sum('intent_score') / count) * 10) / 10,
      avgTiming: Math.round((sum('timing_score') / count) * 10) / 10,
      avgEngagement: Math.round((sum('engagement_score') / count) * 10) / 10,
      avgOpportunity: Math.round((sum('final_score') / count) * 10) / 10,
      totalOpportunities: count
    };
  }
  
  static async getTopOpportunities(limit: number = 10) {
    const { data, error } = await supabase
      .from('opportunity_scores')
      .select(`
        id, 
        company_id, 
        product_id, 
        final_score,
        fit_score,
        intent_score,
        timing_score,
        engagement_score,
        companies ( name ),
        products ( name )
      `)
      .order('final_score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return data.map((d: any) => ({
      ...d,
      company_name: d.companies?.name,
      product_name: d.products?.name
    }));
  }
  
}
