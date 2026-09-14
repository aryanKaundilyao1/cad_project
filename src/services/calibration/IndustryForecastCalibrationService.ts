import { supabase } from "@/integrations/supabase/client";

export class IndustryForecastCalibrationService {
  /**
   * Adjusts default engine weightings based on the specific industry of the opportunity.
   * e.g. Construction/EPC deals have longer cycles and heavy procurement weighting.
   */
  static async calibrateForIndustry(opportunityId: string, industry: string) {
    if (industry === 'Construction' || industry === 'EPC' || industry === 'PEB') {
      // In Construction, procurement approval is overwhelmingly the biggest blocker.
      // If procurement approval is missing, cap win probability at 40%.
      
      const { data: approval } = await supabase
        .from('approval_intelligence')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('approval_type', 'PROCUREMENT')
        .eq('status', 'APPROVED')
        .maybeSingle();
        
      if (!approval) {
        // Find existing prob profile
        const { data: probProfile } = await supabase
          .from('purchase_probability_profiles')
          .select('*')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();
          
        if (probProfile && (probProfile.win_probability ?? 0) > 40) {
          // Force correction
          await supabase
            .from('purchase_probability_profiles')
            .update({
              win_probability: 40,
              probability_status: 'INDUSTRY_CALIBRATED'
            })
            .eq('id', probProfile.id);
            
          // Add driver explaining the calibration
          await supabase
            .from('probability_drivers')
            .insert({
              profile_id: probProfile.id,
              opportunity_id: opportunityId,
              driver_type: 'BLOCKER',
              severity: 'HIGH',
              source_engine: 'IndustryCalibration',
              description: `[${industry} Rule] Max probability capped at 40% until Procurement Approval is secured.`
            });
        }
      }
    }
  }
}
