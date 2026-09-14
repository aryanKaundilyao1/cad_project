import { supabase } from "@/integrations/supabase/client";
import { StakeholderProfileService } from "./StakeholderProfileService";
import { StakeholderInfluenceEngine } from "./StakeholderInfluenceEngine";
import { StakeholderEngagementEngine } from "./StakeholderEngagementEngine";
import { StakeholderSentimentEngine } from "./StakeholderSentimentEngine";
import { StakeholderAccessibilityEngine } from "./StakeholderAccessibilityEngine";
import { StakeholderPriorityEngine } from "./StakeholderPriorityEngine";
import { OpportunitySignalService } from "../signals/OpportunitySignalService";

export class StakeholderRecalculationService {
  
  /**
   * Recalculates all intelligence pillars for a specific stakeholder.
   * This is typically invoked by an event listener when a new signal arrives.
   */
  static async recalculateProfile(profileId: string, triggerSignalId?: string) {
    // 1. Fetch current profile state
    const { data: profileData, error: profileError } = await supabase
      .from('stakeholder_profiles')
      .select('*, committee_members(role_definition_id)')
      .eq('id', profileId)
      .single();

    if (profileError || !profileData) throw profileError;
    const profile = profileData as any;

    // Fetch Roles
    const roleIds = profile.committee_members.map((cm: any) => cm.role_definition_id);
    let roles = [];
    if (roleIds.length > 0) {
      const { data: rolesData } = await supabase
        .from('stakeholder_role_definitions')
        .select('*')
        .in('id', roleIds);
      roles = rolesData || [];
    }

    // Fetch Signals
    const signals = await OpportunitySignalService.getSignalsByContact(profile.contact_id);

    // 2. Run Engines
    const influence = StakeholderInfluenceEngine.calculate(profile, roles);
    const engagement = StakeholderEngagementEngine.calculate(signals);
    const sentiment = StakeholderSentimentEngine.calculate(signals);
    
    // Create temporary profile for subsequent engines
    const tempProfile = {
      ...profile,
      influence_score: influence.score,
      engagement_score: engagement.score,
      sentiment_score: sentiment.score
    };

    const accessibility = StakeholderAccessibilityEngine.calculate(tempProfile);
    
    tempProfile.accessibility_score = accessibility.score;
    const priority = StakeholderPriorityEngine.calculate(tempProfile);

    const aggregateConfidence = Math.round(
      (influence.confidence + engagement.confidence + sentiment.confidence + accessibility.confidence + priority.confidence) / 5
    );

    // 3. Persist to History (Audit Log)
    await supabase.from('stakeholder_scores').insert({
      stakeholder_profile_id: profileId,
      opportunity_id: profile.opportunity_id,
      influence_score: influence.score,
      engagement_score: engagement.score,
      sentiment_score: sentiment.score,
      accessibility_score: accessibility.score,
      priority_score: priority.score,
      confidence_score: aggregateConfidence,
      trigger_signal_id: triggerSignalId,
      drivers: {
        influence: influence.drivers,
        engagement: engagement.drivers,
        sentiment: sentiment.drivers,
        accessibility: accessibility.drivers,
        priority: priority.drivers
      }
    });

    // 4. Update Current State (Fast read layer)
    await supabase.from('stakeholder_profiles').update({
      influence_score: influence.score,
      engagement_score: engagement.score,
      sentiment_score: sentiment.score,
      accessibility_score: accessibility.score,
      priority_score: priority.score,
      updated_at: new Date().toISOString()
    }).eq('id', profileId);

    return tempProfile;
  }
}
