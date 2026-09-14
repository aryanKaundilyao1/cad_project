export class RelevantJobPostingEngine {
  /**
   * HasRelevantOpenJobPosting
   * Max 4 points. 
   */
  static evaluate(jobPostings: any[]): number {
    if (!jobPostings || jobPostings.length === 0) return 0;
    
    // For this blueprint, presence of any relevant job posting yields full points.
    return 4;
  }
}
