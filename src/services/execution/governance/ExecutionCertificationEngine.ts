import { supabase } from "@/integrations/supabase/client";
import { ExecutionExplainabilityEngine } from "./ExecutionExplainabilityEngine";
import { ExecutionComplianceService } from "./ExecutionComplianceService";

export class ExecutionCertificationEngine {
  /**
   * The final gate. Certifies that a proposal passed policy and risk checks before it can be queued.
   */
  static async certifyExecution(proposalId: string, payload: any) {
    const compliance = await ExecutionComplianceService.validateCompliance(proposalId, payload);
    
    let status = 'REJECTED';
    if (compliance.isCompliant) {
      status = 'CERTIFIED';
    }

    const { data: certification, error } = await supabase.from('execution_certifications').insert({
      proposal_id: proposalId,
      status,
      certification_data: { riskLevel: compliance.riskLevel }
    }).select('*').single();

    if (error || !certification) throw new Error("Failed to certify execution");
    return certification;
  }
}
