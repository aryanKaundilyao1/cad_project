import { supabase } from "@/integrations/supabase/client";
import { ProbabilityDriverService, DriverType, DriverSeverity } from "./ProbabilityDriverService";

export class ProbabilityDriverEngine {
  /**
   * Generates Drivers by evaluating all existing intelligence.
   * This is an automated rule-based evaluation.
   */
  static async evaluateDrivers(profileId: string, opportunityId: string) {
    // Soft delete / archive all existing active automated drivers before regeneration
    await supabase
      .from('probability_drivers')
      .update({ status: 'ARCHIVED' })
      .eq('opportunity_id', opportunityId)
      .eq('status', 'ACTIVE');

    // 1. Evaluate Decision Readiness
    const { data: decProfile } = await supabase
      .from('decision_profiles')
      .select('decision_readiness_score, decision_risk_score, decision_momentum_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();

    if (decProfile) {
      if ((decProfile.decision_readiness_score ?? 0) >= 80) {
        await ProbabilityDriverService.addDriver(profileId, opportunityId, 'ACCELERATOR', 'HIGH', 'DecisionIntelligence', 'Decision readiness is extremely high.');
      } else if ((decProfile.decision_readiness_score ?? 0) < 30) {
        await ProbabilityDriverService.addDriver(profileId, opportunityId, 'RISK', 'MEDIUM', 'DecisionIntelligence', 'Decision readiness is lagging.');
      }

      if ((decProfile.decision_risk_score ?? 0) >= 75) {
        await ProbabilityDriverService.addDriver(profileId, opportunityId, 'BLOCKER', 'CRITICAL', 'DecisionIntelligence', 'Critical decision risks detected.');
      }
    }

    // 2. Evaluate Committee Health
    const { data: committee } = await supabase
      .from('committee_intelligence')
      .select('health_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();
      
    if (committee) {
      if ((committee.health_score ?? 0) >= 85) {
        await ProbabilityDriverService.addDriver(profileId, opportunityId, 'POSITIVE', 'MEDIUM', 'StakeholderIntelligence', 'Committee health is strong and consensus is building.');
      } else if ((committee.health_score ?? 0) < 40) {
        await ProbabilityDriverService.addDriver(profileId, opportunityId, 'NEGATIVE', 'HIGH', 'StakeholderIntelligence', 'Committee lacks alignment or key members.');
      }
    }
  }
}
