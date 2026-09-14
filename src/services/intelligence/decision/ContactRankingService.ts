import { supabase } from '@/integrations/supabase/client';
import { ContactData } from './contacts/StakeholderScoringEngine';
import { InfluenceData } from './contacts/InfluenceScoringEngine';
import { ContactPrioritizationEngine, EvaluatedContact } from './contacts/ContactPrioritizationEngine';
import { ContactExplainabilityEngine } from './contacts/ContactExplainabilityEngine';

export interface RankingInput {
    companyId: string;
    opportunityId?: string;
    contacts: {
        contact: ContactData;
        influenceData: InfluenceData;
    }[];
    versionId?: string;
}

export class ContactRankingService {
    
    /**
     * Master orchestrator for generating and saving Contact Rankings.
     */
    static async generateRankings(input: RankingInput) {
        
        // 1. Evaluate all contacts
        const evaluatedContacts = input.contacts.map(c => 
            ContactPrioritizationEngine.evaluateContact(c.contact, c.influenceData)
        );

        // 2. Rank them
        const rankedContacts = ContactPrioritizationEngine.rankContacts(evaluatedContacts);

        // Prepare data for DB insertion
        const scoresToInsert: any[] = [];
        const rankingsToInsert: any[] = [];
        const explanationsToInsert: any[] = [];
        const historyToInsert: any[] = [];

        for (let i = 0; i < rankedContacts.length; i++) {
            const rc = rankedContacts[i];
            const rankPosition = i + 1;
            
            // Map reason codes to DB IDs (In a real app we'd fetch these once, caching them)
            // For simplicity in this demo, we'll store the text codes if the DB column was changed to TEXT[]
            // Wait, in my migration I made reason_codes TEXT[], so we can just pass them!

            scoresToInsert.push({
                company_id: input.companyId,
                contact_id: rc.contactId,
                seniority_score: rc.seniorityScore,
                engagement_score: rc.engagementScore,
                archetype_score: rc.archetypeScore,
                influence_score: rc.influenceScore,
                decision_maker_score: rc.dmScore,
                total_score: rc.totalScore
            });

            rankingsToInsert.push({
                company_id: input.companyId,
                contact_id: rc.contactId,
                rank_score: rc.totalScore,
                rank_position: rankPosition,
                stakeholder_role: rc.role,
                confidence_score: 95, // Example hardcode, should be derived
                reason_codes: rc.reasonCodes,
                version_id: input.versionId
            });
            
            const explanation = ContactExplainabilityEngine.generateExplanation(rc, rankPosition);
            
            explanationsToInsert.push({
                company_id: input.companyId,
                contact_id: rc.contactId,
                explanation: explanation,
                reason_codes: rc.reasonCodes
            });

            historyToInsert.push({
                company_id: input.companyId,
                contact_id: rc.contactId,
                rank_position: rankPosition,
                stakeholder_role: rc.role,
                rank_score: rc.totalScore,
                version_id: input.versionId
            });
        }

        // Run Inserts
        // We might want to clear old rankings for this company/opp first in a real scenario
        if (rankingsToInsert.length > 0) {
            await supabase.from('decision_contact_scores').insert(scoresToInsert);
            await supabase.from('decision_contact_rankings').insert(rankingsToInsert);
            await supabase.from('decision_contact_explanations').insert(explanationsToInsert);
            await supabase.from('decision_contact_history').insert(historyToInsert); // Immutable log
        }

        return rankedContacts;
    }
}
