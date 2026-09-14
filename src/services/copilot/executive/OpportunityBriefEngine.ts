import { ContextPackagingPipeline } from "../context/ContextPackagingPipeline";

export class OpportunityBriefEngine {
  /**
   * Prepares a highly specific context package tailored for a general deal overview.
   */
  static async buildOpportunityContext(opportunityId: string) {
    const mockSessionId = '00000000-0000-0000-0000-000000000002'; 
    const packageId = await ContextPackagingPipeline.buildContextPackage(opportunityId, mockSessionId, 'GENERAL_SUMMARY');

    return packageId;
  }
}
