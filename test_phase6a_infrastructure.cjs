const { supabase } = require('./src/lib/supabase');
const { DecisionAuditService } = require('./src/services/intelligence/decision/DecisionAuditService');
const { PlaybookCatalogService } = require('./src/services/intelligence/decision/PlaybookCatalogService');
const { ActionCatalogService } = require('./src/services/intelligence/decision/ActionCatalogService');
const { DecisionVersionService } = require('./src/services/intelligence/decision/DecisionVersionService');
const { DecisionRecommendationService } = require('./src/services/intelligence/decision/DecisionRecommendationService');

async function runTests() {
    console.log("--- Phase 6A: Decision Infrastructure Tests ---");

    try {
        // 1. Check catalogs
        console.log("[1] Checking Playbook Catalog...");
        const playbooks = await PlaybookCatalogService.getPlaybooks();
        console.log(`    Found ${playbooks.length} playbooks.`);
        
        console.log("\n[2] Checking Action Catalog...");
        const actions = await ActionCatalogService.getActions();
        console.log(`    Found ${actions.length} actions.`);

        // 2. Create a version
        console.log("\n[3] Creating Decision Version...");
        const vNumber = `6.0.0-test-${Date.now()}`;
        const version = await DecisionVersionService.createVersion({
            version_number: vNumber,
            description: "Test version"
        });
        console.log(`    Created version ${version.id}`);

        // 3. Create a mock recommendation
        console.log("\n[4] Creating Mock Recommendation...");
        // Need a company ID. We'll query one or just mock it if FK is strictly enforced, but we'll try to find one first.
        const { data: companies } = await supabase.from('companies').select('id').limit(1);
        let companyId = companies && companies.length > 0 ? companies[0].id : null;
        
        if (!companyId) {
            console.log("    No companies found to link. Skipping recommendation creation test.");
        } else {
            const rec = await DecisionRecommendationService.createRecommendation({
                company_id: companyId,
                recommendation_type: 'action',
                version_id: version.id,
                confidence_score: 85.5,
                metadata: { action_id: actions[0]?.id }
            });
            console.log(`    Created Recommendation ${rec.id}`);

            // Update it to check history and audit
            const updatedRec = await DecisionRecommendationService.updateRecommendationStatus(rec.id, 'accepted', undefined, 'User clicked accept');
            console.log(`    Updated Recommendation status to ${updatedRec.recommendation_status}`);
        }

        // 4. Verify Audit Logs
        console.log("\n[5] Checking Audit Logs...");
        const auditLogs = await DecisionAuditService.getLogs({ limit: 5 });
        console.log(`    Found ${auditLogs.count} total audit logs. Latest: ${auditLogs.data[0]?.action} on ${auditLogs.data[0]?.entity_type}`);

        console.log("\n--- Phase 6A Tests Complete ---");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

// Quick mock for supabase if run via node directly without React setup
// For actual execution, use vitest or jest. This is a smoke test script.
if (require.main === module) {
    runTests().then(() => process.exit(0));
}
