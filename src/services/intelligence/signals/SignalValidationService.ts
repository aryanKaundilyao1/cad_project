import { OpportunitySignal } from "./SignalTypes";

export class SignalValidationService {
  /**
   * Validates a candidate signal before it is inserted into the database.
   * Rules:
   * 1. Must have an opportunity_id
   * 2. Must have evidence
   * 3. Must have a source
   * 4. Must have a definition_id (for traceability)
   */
  static validateCandidate(candidate: Partial<OpportunitySignal>): { valid: boolean; reason?: string } {
    if (!candidate.opportunity_id) {
      return { valid: false, reason: "Missing opportunity_id. Signals must be Opportunity-aware." };
    }
    
    if (!candidate.evidence) {
      return { valid: false, reason: "Missing evidence. Signals cannot be generated on assumptions." };
    }

    if (!candidate.source) {
      return { valid: false, reason: "Missing source. Traceability is required." };
    }

    if (!candidate.definition_id) {
      return { valid: false, reason: "Missing definition_id. Must map to a known taxonomy." };
    }

    return { valid: true };
  }
}
