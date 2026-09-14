export class DecisionReadinessValidationService {
  /**
   * Validates that the readiness score does not mathematically hallucinate
   * (e.g. hitting 100% when there are pending milestones).
   */
  static validate(scores: any[], milestones: any[]): boolean {
    let isValid = true;
    for (const score of scores) {
      if (score.readiness_score === 100) {
        // If it claims 100% readiness, all milestones must be complete
        const pending = milestones.filter(m => m.decision_profile_id === score.decision_profile_id && m.status !== 'COMPLETED');
        if (pending.length > 0) {
          console.error(`Validation Failed: DecisionProfile ${score.decision_profile_id} claims 100% readiness but has pending milestones.`);
          isValid = false;
        }
      }
    }
    return isValid;
  }
}
