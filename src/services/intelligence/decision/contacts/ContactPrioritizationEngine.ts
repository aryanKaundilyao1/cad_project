import { ContactData, StakeholderScoringEngine } from './StakeholderScoringEngine';
import { DecisionMakerEngine } from './DecisionMakerEngine';
import { InfluenceScoringEngine, InfluenceData } from './InfluenceScoringEngine';

export interface EvaluatedContact {
    contactId: string;
    seniorityScore: number;
    engagementScore: number;
    archetypeScore: number;
    influenceScore: number;
    dmScore: number;
    totalScore: number;
    isDecisionMaker: boolean;
    isInfluencer: boolean;
    role: string;
    reasonCodes: string[];
}

export class ContactPrioritizationEngine {
    
    /**
     * Calculates the final ContactRank and assigns roles.
     * ContactRank = (SeniorityScore * 0.40) + (EngagementScore * 0.40) + (ArchetypeMatchScore * 0.20)
     */
    static evaluateContact(contact: ContactData, influenceData: InfluenceData): EvaluatedContact {
        const seniority = StakeholderScoringEngine.calculateSeniorityScore(contact.title);
        const engagement = StakeholderScoringEngine.calculateEngagementScore(contact.engagementMetrics);
        const archetype = contact.archetypeMatch || 0;

        // Base Score
        let totalScore = (seniority * 0.40) + (engagement * 0.40) + (archetype * 0.20);
        
        // Sub-Engines
        const dmResult = DecisionMakerEngine.calculateDecisionMakerScore(seniority, engagement, contact.department, archetype);
        const influenceResult = InfluenceScoringEngine.calculateInfluenceScore(influenceData, engagement);

        const reasonCodes: string[] = [];
        if (seniority >= 85) reasonCodes.push('HIGH_SENIORITY');
        if (engagement >= 70) reasonCodes.push('HIGH_ENGAGEMENT');
        if (archetype >= 80) reasonCodes.push('ARCHETYPE_MATCH');
        if (engagement < 10) reasonCodes.push('LOW_ACTIVITY');

        let role = 'End User'; // Default
        
        // Prioritization Rules
        if (dmResult.isDecisionMaker && engagement > 60) {
            totalScore += 10; // Boost
            role = 'Decision Maker';
            reasonCodes.push('DECISION_MAKER');
        } else if (influenceResult.isInfluencer) {
            role = 'Influencer';
            reasonCodes.push('INFLUENCER');
        }

        // Cap score
        totalScore = Math.min(100, Math.max(0, totalScore));

        return {
            contactId: contact.id,
            seniorityScore: seniority,
            engagementScore: engagement,
            archetypeScore: archetype,
            influenceScore: influenceResult.influenceScore,
            dmScore: dmResult.dmScore,
            totalScore: totalScore,
            isDecisionMaker: dmResult.isDecisionMaker,
            isInfluencer: influenceResult.isInfluencer,
            role,
            reasonCodes
        };
    }

    static rankContacts(evaluatedContacts: EvaluatedContact[]): EvaluatedContact[] {
        // Sort descending by total score
        return evaluatedContacts.sort((a, b) => b.totalScore - a.totalScore);
    }
}
