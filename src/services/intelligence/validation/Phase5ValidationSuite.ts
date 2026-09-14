import { Phase6ReadinessService } from "./Phase6ReadinessService";

export class Phase5ValidationSuite {
  /**
   * Main entry point to run the certification for Phase 5.
   */
  static async runAllValidations() {
    console.log("Starting Phase 5F Stakeholder Intelligence Validation Suite...");

    const readinessReport = await Phase6ReadinessService.certifyReadiness();

    console.log("Phase 6 Readiness Certification:", readinessReport.status);
    console.log("Detailed Results:", JSON.stringify(readinessReport.results, null, 2));

    return readinessReport;
  }
}
