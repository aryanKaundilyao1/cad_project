import { supabase } from "@/integrations/supabase/client";
import { ConversationValidationSuite } from "./ConversationValidationSuite";
import { ContextValidationSuite } from "./ContextValidationSuite";
import { BriefingValidationSuite } from "./BriefingValidationSuite";
import { GroundingCertificationSuite } from "./GroundingCertificationSuite";
import { HallucinationDetectionSuite } from "./HallucinationDetectionSuite";

export class OpportunityCopilotCertificationService {
  /**
   * The Master Orchestrator for Phase 9E.
   * Runs the entire suite of automated red-team tests and audits to certify the Copilot.
   */
  static async runFullCertification() {
    console.log("INITIATING FULL COPILOT CERTIFICATION...");

    const isConvValid = ConversationValidationSuite.runAudit();
    const isContextValid = ContextValidationSuite.runAudit();
    const isBriefingValid = await BriefingValidationSuite.runAudit();
    const isGroundingValid = GroundingCertificationSuite.runAudit();
    const isHallucinationValid = HallucinationDetectionSuite.runAudit();

    const allPassed = isConvValid && isContextValid && isBriefingValid && isGroundingValid && isHallucinationValid;
    const finalStatus = allPassed ? 'PASSED' : 'FAILED';

    // Log the run to the database
    const { data: runRecord } = await supabase.from('copilot_certification_runs').insert({
      status: finalStatus,
      conversation_layer_status: isConvValid ? 'PASSED' : 'FAILED',
      context_layer_status: isContextValid ? 'PASSED' : 'FAILED',
      briefing_layer_status: isBriefingValid ? 'PASSED' : 'FAILED',
      grounding_layer_status: isGroundingValid ? 'PASSED' : 'FAILED',
      hallucination_test_status: isHallucinationValid ? 'PASSED' : 'FAILED',
      total_tests_run: 5,
      total_failures: [isConvValid, isContextValid, isBriefingValid, isGroundingValid, isHallucinationValid].filter(x => !x).length
    }).select('id').single();

    console.log(`CERTIFICATION COMPLETE. Status: ${finalStatus}`);
    
    return {
      runId: runRecord?.id,
      status: finalStatus,
      details: {
        conversation: isConvValid,
        context: isContextValid,
        briefing: isBriefingValid,
        grounding: isGroundingValid,
        hallucination: isHallucinationValid
      }
    };
  }
}
