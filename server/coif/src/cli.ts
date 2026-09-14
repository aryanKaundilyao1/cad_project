import { COIFEngine } from './engine/COIFEngine';
import { RankingEngine } from './engine/RankingEngine';
import { ReasonEngine } from './engine/ReasonEngine';
import { testClient, testLeads } from '../test/dataset';

function run() {
  console.log(`\nStarting COIF Phase 1 Execution...`);
  console.log(`Client: ${testClient.name} (Targeting: ${testClient.targetProducts.join(', ')})\n`);

  const results = COIFEngine.evaluate(testClient, testLeads);
  const rankedResults = RankingEngine.rank(results);

  rankedResults.forEach(r => {
    console.log(`==================================================`);
    console.log(`Lead Name: ${r.leadName}`);
    console.log(`Source: ${r.sources.join(', ')}`);
    console.log(`OIE Score: ${r.baselineOIEScore}`);
    console.log(`COIF Score: ${r.coifScore}`);
    console.log(`Final Recommendation Score: ${r.finalScore}`);
    console.log(`Confidence: ${r.confidenceTier} (${r.confidenceScore}%)`);
    console.log(`\nReason Codes:`);
    ReasonEngine.format(r.reasons).forEach(rc => console.log(rc));
    console.log(`\nEvidence Summary:`);
    r.evidenceSummary.forEach(e => console.log(`- ${e}`));
    console.log(`==================================================\n`);
  });

  console.log(`\n--- RANKINGS ---`);
  
  const printTop = (limit: number, title: string) => {
    console.log(`\n${title}`);
    rankedResults.slice(0, limit).forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.leadName} | Final Score: ${r.finalScore} | Confidence: ${r.confidenceTier}`);
    });
  };

  printTop(20, 'TOP 20 (All Leads)');
  printTop(10, 'TOP 10');
  printTop(5, 'TOP 5');
  printTop(3, 'TOP 3');
}

run();
