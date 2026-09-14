import { ContactData } from './StakeholderScoringEngine';

export interface InfluenceData {
    meetingParticipation?: number; // How often they are in meetings with DMs
    multiThreadedEmails?: number; // How often they are CC'd on important threads
    internalReferrals?: number; // How often their name comes up in notes
}

export class InfluenceScoringEngine {
    
    /**
     * Determines if someone is an Influencer.
     * Often these are not DMs, but they participate heavily in the process.
     */
    static calculateInfluenceScore(data: InfluenceData, engagementScore: number): { influenceScore: number, isInfluencer: boolean } {
        let score = 0;
        
        score += (data.meetingParticipation || 0) * 25;
        score += (data.multiThreadedEmails || 0) * 10;
        score += (data.internalReferrals || 0) * 30;
        
        // Add a factor of their engagement
        score += (engagementScore * 0.2);
        
        const finalScore = Math.min(100, score);
        
        return {
            influenceScore: finalScore,
            isInfluencer: finalScore > 60
        };
    }
}
