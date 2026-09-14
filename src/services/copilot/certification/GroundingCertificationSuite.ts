import { GroundingService } from "../GroundingService";

export class GroundingCertificationSuite {
  /**
   * Tests the core Grounding Firewall (Phase 9A).
   * Intentionally feeds it hallucinated numbers to ensure they are blocked.
   */
  static runAudit(): boolean {
    console.log("Running Grounding Certification...");
    
    const mockContext = { data: { Forecast: "$100,000" } };
    
    // Simulate LLM hallucination
    const fakeResponse = "The forecast is $900,000.";
    const result = GroundingService.validateResponse(fakeResponse, mockContext);

    // It MUST fail to pass the certification
    if (result.isValid === true) {
       console.error("CRITICAL: Grounding Firewall failed to block hallucinated forecast.");
       return false;
    }

    return true; 
  }
}
