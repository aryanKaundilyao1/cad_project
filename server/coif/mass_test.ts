import { COIFEngine } from './src/engine/COIFEngine';
import { ClientContext, Lead, SourceType } from './src/engine/types';

// Dummy Client
const dummyClient: ClientContext = {
  id: 'client-ayurveda-1',
  name: 'Premium Ayurveda Exports',
  industry: 'Healthcare / Ayurveda',
  targetProducts: ['ashwagandha', 'turmeric', 'brahmi', 'ayurvedic extract', 'herbal supplement'],
  targetBuyerTypes: ['wholesaler', 'distributor', 'pharmacy chain', 'private label'],
  targetCountries: ['USA', 'UK', 'Germany', 'UAE', 'Australia'],
  requiredCertifications: ['GMP', 'ISO 9001', 'Organic']
};

function generateDummyLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  const sourcePool: SourceType[] = ['Google Maps', 'Apollo', 'Government', 'Trade Data', 'Marketplace', 'Website'];
  const keywordPool = ['ashwagandha', 'turmeric', 'cosmetics', 'electronics', 'apparel', 'herbal', 'pharmacy', 'IT services', 'chemicals'];
  const countryPool = ['USA', 'UK', 'Germany', 'India', 'China', 'Brazil', 'Japan', 'UAE'];
  
  for (let i = 0; i < count; i++) {
    // Randomize some attributes
    const numSources = Math.floor(Math.random() * 3) + 1;
    const sources = Array.from({length: numSources}, () => sourcePool[Math.floor(Math.random() * sourcePool.length)]);
    
    // Create random keywords, 10% chance to have an exact target match to simulate rare gold leads
    let keywords = [];
    if (Math.random() > 0.9) {
      keywords.push(dummyClient.targetProducts[Math.floor(Math.random() * dummyClient.targetProducts.length)]);
    }
    keywords.push(keywordPool[Math.floor(Math.random() * keywordPool.length)]);
    
    // Simulated OIE Score (normally coming from OIE Engine)
    // Most leads are average (40-60), some are great (80-100), some are garbage (0-20)
    let baselineOIEScore = Math.floor(Math.random() * 100);
    if (Math.random() > 0.8) baselineOIEScore = Math.max(80, baselineOIEScore); // Boost top 20%
    
    leads.push({
      id: `lead-${i}`,
      name: `Company ${i}`,
      sources,
      baselineOIEScore,
      metrics: {
        hasWebsite: Math.random() > 0.3,
        hasEmail: Math.random() > 0.2,
        hasPhone: Math.random() > 0.1,
        country: countryPool[Math.floor(Math.random() * countryPool.length)],
        productKeywords: keywords,
        revenue: Math.floor(Math.random() * 50000000), // Up to 50M
        reviewCount: Math.floor(Math.random() * 500),
      }
    });
  }
  return leads;
}

const TOTAL_LEADS = 2000;
console.log(`Generating ${TOTAL_LEADS} dummy leads...`);
const leads = generateDummyLeads(TOTAL_LEADS);

console.log(`Running COIF Engine for Client: ${dummyClient.name}...`);
const start = performance.now();
const results = COIFEngine.evaluate(dummyClient, leads);
const end = performance.now();

console.log(`Scoring completed in ${(end - start).toFixed(2)}ms.\n`);

// Sort by Final Fusion Score
results.sort((a, b) => b.finalScore - a.finalScore);

console.log("=========================================");
console.log("       COLLECTIVE RESULT SUMMARY         ");
console.log("=========================================\n");

const top20 = results.slice(0, 20);
const top50 = results.slice(0, 50);
const top100 = results.slice(0, 100);

console.log(`Total Leads Processed: ${TOTAL_LEADS}`);
console.log(`Average OIE Score (Raw Database Quality): ${(leads.reduce((sum, l) => sum + l.baselineOIEScore, 0) / TOTAL_LEADS).toFixed(1)}`);
console.log(`Average Final Score (COIF + OIE): ${(results.reduce((sum, r) => sum + r.finalScore, 0) / TOTAL_LEADS).toFixed(1)}\n`);

console.log("--- Distinguishing the Top 20 ---");
console.log(`Top 20 Avg Final Score: ${(top20.reduce((sum, r) => sum + r.finalScore, 0) / 20).toFixed(1)}`);
console.log(`Top 20 Avg OIE Score: ${(top20.reduce((sum, r) => sum + r.baselineOIEScore, 0) / 20).toFixed(1)}`);
console.log(`Top 20 Avg COIF Client Match Score: ${(top20.reduce((sum, r) => sum + r.coifScore, 0) / 20).toFixed(1)}`);
const highConfidence20 = top20.filter(r => r.confidenceTier === 'High').length;
console.log(`Top 20 with 'High' Confidence: ${highConfidence20} / 20\n`);

console.log("--- Distinguishing the Top 50 ---");
console.log(`Top 50 Avg Final Score: ${(top50.reduce((sum, r) => sum + r.finalScore, 0) / 50).toFixed(1)}`);
console.log(`Top 50 Avg COIF Client Match Score: ${(top50.reduce((sum, r) => sum + r.coifScore, 0) / 50).toFixed(1)}\n`);

console.log("--- Distinguishing the Top 100 ---");
console.log(`Top 100 Avg Final Score: ${(top100.reduce((sum, r) => sum + r.finalScore, 0) / 100).toFixed(1)}\n`);

console.log("=========================================");
console.log("       SAMPLE OF A TOP 5 LEAD            ");
console.log("=========================================\n");
const sampleTop = top20[0];
console.log(`Lead Name: ${sampleTop.leadName}`);
console.log(`OIE Score (Generic Quality): ${sampleTop.baselineOIEScore}`);
console.log(`COIF Score (Client Context Match): ${sampleTop.coifScore}`);
console.log(`Final Fusion Score: ${sampleTop.finalScore}`);
console.log(`Confidence: ${sampleTop.confidenceScore}% (${sampleTop.confidenceTier})`);
console.log("Reason Codes for High Ranking:");
sampleTop.reasons.slice(0, 5).forEach(r => console.log(` - [${r.category}] ${r.description} (Impact: ${r.impact})`));
console.log("\n=========================================");
console.log("       SAMPLE OF A BOTTOM 5 LEAD         ");
console.log("=========================================\n");
const sampleBottom = results[results.length - 1];
console.log(`Lead Name: ${sampleBottom.leadName}`);
console.log(`OIE Score (Generic Quality): ${sampleBottom.baselineOIEScore}`);
console.log(`COIF Score (Client Context Match): ${sampleBottom.coifScore}`);
console.log(`Final Fusion Score: ${sampleBottom.finalScore}`);
console.log("Reason Codes for Low Ranking:");
sampleBottom.reasons.filter(r => String(r.impact).includes('-') || String(r.impact) === 'Low').slice(0, 5).forEach(r => console.log(` - [${r.category}] ${r.description} (Impact: ${r.impact})`));

