import { supabase } from "@/integrations/supabase/client";

export class RevenueIntelligenceCertificationService {
  /**
   * Evaluates the integrity and traceability of the intelligence ecosystem for a given opportunity.
   */
  static async certifyIntelligence(opportunityId: string) {
    let overallStatus = "GO";
    const certs: Record<string, string> = {
      purchase_probability: "CERTIFIED",
      revenue_intelligence: "CERTIFIED",
      forecast_intelligence: "CERTIFIED",
      close_timing: "CERTIFIED"
    };

    // 1. Verify Probability has Drivers
    const { data: probProfile } = await supabase.from('purchase_probability_profiles').select('*').eq('opportunity_id', opportunityId).maybeSingle();
    const { count: driverCount } = await supabase.from('probability_drivers').select('*', { count: 'exact', head: true }).eq('opportunity_id', opportunityId);
    
    if (probProfile && probProfile.win_probability && (probProfile.win_probability > 20) && (!driverCount || driverCount === 0)) {
      certs.purchase_probability = "FAILED";
      overallStatus = "NO GO";
      await this.logFailure(opportunityId, 'PROBABILITY', 'Probability exceeds base without active drivers.');
    }

    // 2. Verify Forecast Traceability
    const { data: forecast } = await supabase.from('revenue_forecasts').select('*').eq('opportunity_id', opportunityId).maybeSingle();
    if (forecast && forecast.best_case && forecast.expected_case && (forecast.best_case > forecast.expected_case)) {
      const { count: forecastDriverCount } = await supabase.from('forecast_drivers').select('*', { count: 'exact', head: true }).eq('opportunity_id', opportunityId);
      if (!forecastDriverCount || forecastDriverCount === 0) {
        certs.forecast_intelligence = "FAILED";
        overallStatus = "NO GO";
        await this.logFailure(opportunityId, 'FORECAST', 'Best case exceeds expected case without positive forecast drivers.');
      }
    }

    return {
      phase: "7E",
      ...certs,
      overall_status: overallStatus
    };
  }

  private static async logFailure(opportunityId: string, domain: string, description: string) {
    // Upsert certification record
    const { data: cert } = await supabase
      .from('intelligence_certifications')
      .upsert({ opportunity_id: opportunityId, domain, status: 'FAILED' }, { onConflict: 'opportunity_id, domain' })
      .select()
      .single();

    if (cert) {
      await supabase.from('certification_logs').insert({
        certification_id: cert.id,
        issue_type: 'VALIDATION_ERROR',
        description
      });
    }
  }
}
