import { ContactPrioritizationEngine } from './src/services/intelligence/decision/contacts/ContactPrioritizationEngine';
import { StakeholderScoringEngine } from './src/services/intelligence/decision/contacts/StakeholderScoringEngine';
import { DecisionMakerEngine } from './src/services/intelligence/decision/contacts/DecisionMakerEngine';
import { ContactExplainabilityEngine } from './src/services/intelligence/decision/contacts/ContactExplainabilityEngine';

async function runTests() {
    console.log("--- Phase 6C: Contact Prioritization Engine Tests ---");

    try {
        console.log("\n[1] Testing Seniority & Engagement Scoring...");
        const ceoSeniority = StakeholderScoringEngine.calculateSeniorityScore('CEO');
        const engSeniority = StakeholderScoringEngine.calculateSeniorityScore('Software Engineer');
        
        console.log(`    CEO Seniority Score: ${ceoSeniority}`);
        if (ceoSeniority === 100) console.log("    -> PASSED: CEO is 100");
        console.log(`    Engineer Seniority Score: ${engSeniority}`);
        if (engSeniority === 50) console.log("    -> PASSED: Engineer is 50");

        const engagementScore = StakeholderScoringEngine.calculateEngagementScore({
            meetings: 2, // 40
            proposalViews: 1, // 10
            emailOpens: 5 // 10
        });
        console.log(`    Engagement Score (2 meetings, 1 prop, 5 opens): ${engagementScore}`);
        if (engagementScore === 60) console.log("    -> PASSED: Score is 60");


        console.log("\n[2] Testing Contact Evaluation & Ranking...");
        
        const contactsToRank = [
            {
                contact: {
                    id: 'c1',
                    title: 'Chief Procurement Officer',
                    department: 'Procurement',
                    engagementMetrics: { meetings: 3, proposalViews: 2 }, // High engagement
                    archetypeMatch: 100
                },
                influenceData: { meetingParticipation: 3 }
            },
            {
                contact: {
                    id: 'c2',
                    title: 'Operations Analyst',
                    department: 'Operations',
                    engagementMetrics: { emailOpens: 1 }, // Low engagement
                    archetypeMatch: 30
                },
                influenceData: {}
            }
        ];

        const evaluatedC1 = ContactPrioritizationEngine.evaluateContact(contactsToRank[0].contact, contactsToRank[0].influenceData);
        const evaluatedC2 = ContactPrioritizationEngine.evaluateContact(contactsToRank[1].contact, contactsToRank[1].influenceData);

        console.log(`    C1 (CPO): Total Score: ${evaluatedC1.totalScore.toFixed(2)}, Role: ${evaluatedC1.role}`);
        if (evaluatedC1.isDecisionMaker) console.log("    -> PASSED: Correctly identified CPO as Decision Maker");
        
        console.log(`    C2 (Analyst): Total Score: ${evaluatedC2.totalScore.toFixed(2)}, Role: ${evaluatedC2.role}`);
        
        const ranked = ContactPrioritizationEngine.rankContacts([evaluatedC1, evaluatedC2]);
        console.log(`    Rank #1 is: ${ranked[0].contactId}`);
        if (ranked[0].contactId === 'c1') console.log("    -> PASSED: CPO outranks Analyst");

        console.log("\n[3] Testing Explainability...");
        const explanation = ContactExplainabilityEngine.generateExplanation(evaluatedC1, 1);
        console.log(`    Explanation for C1: "${explanation}"`);

        console.log("\n--- Phase 6C Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests().then(() => process.exit(0));
