import { ContextPackagingPipeline } from "../context/ContextPackagingPipeline";

export class MeetingPrepEngine {
  /**
   * Prepares a highly specific context package tailored for an upcoming meeting.
   * Forces the packaging pipeline to prioritize Stakeholder and Decision risk data.
   */
  static async buildMeetingContext(opportunityId: string, meetingContextInfo: any) {
    // 1. We mock creating a session id for this brief generation
    const mockSessionId = '00000000-0000-0000-0000-000000000001'; 
    
    // 2. Fetch specialized context via the existing Phase 9B pipeline, 
    // passing a specific intent to trigger the ContextRelevanceEngine to fetch meeting data.
    const packageId = await ContextPackagingPipeline.buildContextPackage(opportunityId, mockSessionId, 'MEETING_PREP');

    return {
      packageId,
      meetingDetails: meetingContextInfo
    };
  }
}
