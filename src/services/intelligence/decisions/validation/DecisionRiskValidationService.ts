export class DecisionRiskValidationService {
  /**
   * Validates that risk severities are mapped correctly.
   */
  static validate(scores: any[]): boolean {
    let isValid = true;
    for (const score of scores) {
      if (score.risk_score >= 75 && score.risk_severity !== 'CRITICAL') {
         console.error(`Validation Failed: DecisionProfile ${score.decision_profile_id} has risk score ${score.risk_score} but severity is ${score.risk_severity} (Expected: CRITICAL).`);
         isValid = false;
      }
    }
    return isValid;
  }
}
