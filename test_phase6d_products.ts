import { ProductRecommendationEngine } from './src/services/intelligence/decision/products/ProductRecommendationEngine';
import { PlaybookRecommendationEngine } from './src/services/intelligence/decision/playbooks/PlaybookRecommendationEngine';
import { RecommendationExplainabilityService } from './src/services/intelligence/decision/RecommendationExplainabilityService';

async function runTests() {
    console.log("--- Phase 6D: Product & Playbook Recommendation Engine Tests ---");

    try {
        console.log("\n[1] Testing Product Matching & Scoring...");
        const catalog = [
            { id: 'p1', name: 'PEB Warehouse Package' },
            { id: 'p2', name: 'Solar EPC Package' },
            { id: 'p3', name: 'Vendor Discovery Package' }
        ];

        const signals = [
            { signalName: 'Facility Expansion', weight: 0.9 },
            { signalName: 'Warehouse Permit', weight: 0.8 }
        ];

        const evaluatedProducts = ProductRecommendationEngine.evaluateProducts(
            catalog,
            signals,
            85, // fit
            75, // intent
            80  // probability
        );

        console.log(`    Recommended Product #1: ${evaluatedProducts[0]?.productName}`);
        if (evaluatedProducts[0]?.productName === 'PEB Warehouse Package') {
            console.log("    -> PASSED: Correctly identified PEB Warehouse Package");
        }
        
        console.log("\n[2] Testing Playbook Recommendation Matrix...");
        const playbookResult = PlaybookRecommendationEngine.recommendPlaybook({
            intentScore: 85,
            urgencyScore: 90, // High Urgency
            signals: signals,
            topProduct: evaluatedProducts[0]
        });

        console.log(`    Recommended Playbook: ${playbookResult.playbookName}`);
        if (playbookResult.playbookName === 'Warehouse Construction') {
            console.log("    -> PASSED: Correctly routed to Warehouse Construction playbook based on product");
        }

        console.log("\n[3] Testing Explainability Service...");
        const productEx = RecommendationExplainabilityService.explainProductRecommendation(evaluatedProducts[0]);
        console.log("\n    Product Explanation:");
        console.log(`    ${productEx.replace(/\n/g, '\n    ')}`);

        const playbookEx = RecommendationExplainabilityService.explainPlaybookRecommendation(playbookResult, 90);
        console.log("\n    Playbook Explanation:");
        console.log(`    ${playbookEx.replace(/\n/g, '\n    ')}`);

        console.log("\n--- Phase 6D Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests().then(() => process.exit(0));
