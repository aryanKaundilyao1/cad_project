export class IndustryMatchEngine {
  /**
   * Evaluates the industry match score (0-6 points)
   * Ideally, this compares against the Product's target Archetypes, 
   * but for this foundation phase we will just assign a base score based on presence 
   * (or exact string matching if provided).
   */
  static evaluate(companyIndustry: string | null, targetIndustries?: string[]): number {
    if (!companyIndustry) return 0;
    
    // Exact match = 6 pts
    // Related/Partial = 3 pts
    // No match / Generic = 1 pt
    
    if (targetIndustries && targetIndustries.length > 0) {
      if (targetIndustries.some(i => i.toLowerCase() === companyIndustry.toLowerCase())) {
        return 6;
      }
      return 1;
    }
    
    // Default fallback if no specific targets are set: just existence gets 3 points.
    return 3;
  }
}
