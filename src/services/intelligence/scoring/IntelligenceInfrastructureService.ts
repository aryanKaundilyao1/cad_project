import { supabase } from "@/integrations/supabase/client";
import { OpportunityScoringContext } from "./OpportunityScoringContext";
import { FeatureExtractionService } from "./FeatureExtractionService";
import { FeatureSnapshotService, FeatureSnapshot } from "./FeatureSnapshotService";
import { OpportunitySignalService } from "../signals/OpportunitySignalService";

export class IntelligenceInfrastructureService {
  /**
   * 1. Loads all related CRM records for an opportunity to establish context.
   */
  static async loadContext(opportunityId: string): Promise<OpportunityScoringContext> {
    
    const [oppRes, accRes, contactsRes, tasksRes, activitiesRes, reqsRes, stakeRes, signalsRes] = await Promise.all([
      supabase.from('opportunities').select('*').eq('id', opportunityId).single(),
      // Fetch Account (assuming opportunity maps to account)
      // Since this is infrastructure, we mock the joins that will be implemented in Phase 3B
      Promise.resolve({ data: {} }), // Mock Account
      supabase.from('contacts').select('*').eq('account_id', 'mock_account_id'), // Mock Contacts
      supabase.from('tasks').select('*').eq('opportunity_id', opportunityId),
      supabase.from('activities').select('*').eq('opportunity_id', opportunityId),
      supabase.from('requirements').select('*').eq('opportunity_id', opportunityId),
      supabase.from('stakeholders').select('*').eq('opportunity_id', opportunityId),
      OpportunitySignalService.getActiveSignals(opportunityId)
    ]);

    return {
      opportunity: oppRes.data || {},
      account: accRes.data || {},
      contacts: contactsRes.data || [],
      tasks: tasksRes.data || [],
      activities: activitiesRes.data || [],
      requirements: reqsRes.data || [],
      stakeholders: stakeRes.data || [],
      activeSignals: signalsRes || []
    };
  }

  /**
   * 2. Orchestrates the end-to-end infrastructure preparation before scoring.
   * This method ensures the context is loaded, features are extracted, and snapshots are stored.
   */
  static async prepareInfrastructureForScoring(opportunityId: string, eventSource: string): Promise<void> {
    try {
      // Step A: Load Unified Context
      const context = await this.loadContext(opportunityId);

      // Step B: Generate Features
      const features = FeatureExtractionService.extractFeatures(context, opportunityId);

      // Step C: Persist Snapshots (Stubbed for now, waiting for Phase 3B)
      if (features.length > 0) {
        // await FeatureSnapshotService.storeSnapshots(features);
      }

      // Step D: Phase 3B Scoring logic will be triggered here
      // MasterOpportunityScoreEngine.calculate(context, features...);

    } catch (error) {
      console.error(`Infrastructure preparation failed for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }
}
