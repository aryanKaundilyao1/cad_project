import { ContactData } from './StakeholderScoringEngine';

export class DecisionMakerEngine {
    
    /**
     * Determines if a contact is a Decision Maker.
     * Takes into account Seniority, Title, Department, and Engagement.
     */
    static calculateDecisionMakerScore(
        seniorityScore: number, 
        engagementScore: number, 
        department?: string, 
        archetypeMatch?: number
    ): { dmProbability: number, dmScore: number, isDecisionMaker: boolean } {
        
        let score = (seniorityScore * 0.5) + (engagementScore * 0.2) + ((archetypeMatch || 0) * 0.3);
        
        // Department Boosts (assuming B2B SaaS context where C-level/Procurement/Ops are DMs)
        const lowerDept = department?.toLowerCase() || '';
        if (lowerDept.includes('procurement') || lowerDept.includes('purchasing')) {
            score += 15;
        }
        if (lowerDept.includes('executive') || lowerDept.includes('operations')) {
            score += 10;
        }

        const finalScore = Math.min(100, score);
        
        return {
            dmProbability: finalScore,
            dmScore: finalScore,
            isDecisionMaker: finalScore > 85 // Threshold
        };
    }
}
