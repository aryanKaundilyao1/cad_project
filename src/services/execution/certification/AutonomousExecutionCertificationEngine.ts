import { supabase } from "@/integrations/supabase/client";
import { ExecutionSafetyCertificationSuite } from "./ExecutionSafetyCertificationSuite";
import { HumanControlValidationService } from "./HumanControlValidationService";
import { TraceabilityCertificationService } from "./TraceabilityCertificationService";
import { ComplianceCertificationService } from "./ComplianceCertificationService";
import { GovernanceCertificationService } from "./GovernanceCertificationService";
import { ExecutionAdversarialTestingSuite } from "./ExecutionAdversarialTestingSuite";
import { ExecutionPerformanceCertificationSuite } from "./ExecutionPerformanceCertificationSuite";
import { TenantIsolationCertificationService } from "./TenantIsolationCertificationService";

export class AutonomousExecutionCertificationEngine {
  /**
   * The master orchestrator that aggregates all suite results and generates the final certification report.
   */
  static async runFullCertification() {
    const results = await Promise.all([
      ExecutionSafetyCertificationSuite.runSuite(),
      HumanControlValidationService.runSuite(),
      TraceabilityCertificationService.runSuite(),
      ComplianceCertificationService.runSuite(),
      GovernanceCertificationService.runSuite(),
      ExecutionAdversarialTestingSuite.runSuite(),
      ExecutionPerformanceCertificationSuite.runSuite(),
      TenantIsolationCertificationService.runSuite()
    ]);

    const isFullyCertified = results.every(r => r.isPassed);
    const finalStatus = isFullyCertified ? 'CERTIFIED' : 'NOT_CERTIFIED';

    const { data: report, error } = await supabase.from('execution_certification_reports').insert({
      report_name: 'Phase 12 Autonomous Execution Certification',
      final_status: finalStatus,
      summary: `Automated run generated ${finalStatus}`,
      certification_metadata: { runs: results.length, passed: isFullyCertified }
    }).select('*').single();

    if (error || !report) throw new Error("Failed to generate execution certification report");
    return report;
  }
}
