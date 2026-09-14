export class TechCompatibilityEngine {
  /**
   * Evaluates technical stack match (0-5 points).
   */
  static evaluate(techStack: any, requiredTech?: string[]): number {
    if (!techStack) return 0;
    
    // If specific required tech is provided, check for it.
    if (requiredTech && requiredTech.length > 0 && Array.isArray(techStack)) {
      const matchCount = requiredTech.filter(tech => 
        techStack.some((t: any) => t?.name?.toLowerCase() === tech.toLowerCase())
      ).length;
      
      return matchCount > 0 ? 5 : 0;
    }
    
    // Otherwise, generic presence of tech stack data awards partial points
    return Object.keys(techStack).length > 0 ? 3 : 0;
  }
}
