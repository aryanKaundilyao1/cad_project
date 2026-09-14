import { EvaluatedContact } from './ContactPrioritizationEngine';
import { supabase } from '@/integrations/supabase/client';

export class ContactExplainabilityEngine {
    
    /**
     * Generates a human-readable explanation for a contact's ranking.
     */
    static generateExplanation(contact: EvaluatedContact, rankPosition: number): string {
        let explanation = `Ranked #${rankPosition} due to a total score of ${contact.totalScore.toFixed(1)}. `;
        
        if (contact.reasonCodes.includes('HIGH_SENIORITY')) {
            explanation += 'Contact holds a high-seniority position. ';
        }
        if (contact.reasonCodes.includes('HIGH_ENGAGEMENT')) {
            explanation += 'Contact has shown significant recent engagement. ';
        }
        if (contact.reasonCodes.includes('ARCHETYPE_MATCH')) {
            explanation += 'Contact strongly matches an ideal buyer archetype. ';
        }
        if (contact.isDecisionMaker) {
            explanation += `Identified as a likely Decision Maker (DM Score: ${contact.dmScore.toFixed(1)}). `;
        } else if (contact.isInfluencer) {
            explanation += `Identified as a strong Influencer (Influence Score: ${contact.influenceScore.toFixed(1)}). `;
        }
        
        if (contact.reasonCodes.includes('LOW_ACTIVITY')) {
            explanation += 'Note: Contact has very low recent activity. ';
        }
        
        return explanation.trim();
    }
}
