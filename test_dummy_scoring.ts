import { scoreLead } from './src/scoring/pipeline';

const dummyLeads = [
  {
    company_name: 'Perfect Match Ltd',
    source: 'Tender - Central Govt',
    phone: '9999999999',
    email: 'contact@perfectmatch.gov',
    description: 'Looking for a pre-engineered building warehouse 10000 sqft',
    website: 'https://perfectmatch.gov',
  },
  {
    company_name: 'Incomplete Data Corp',
    source: 'Google Maps Search',
    phone: null,
    email: null,
    description: null,
    website: null,
  },
  {
    company_name: 'Risky Biz Inc',
    source: 'Manual Import',
    phone: '1234567890',
    email: 'fake@scam.com',
    description: 'Require immediate construction. Bankrupt last year.',
    website: 'http://scam.com',
  }
];

for (const lead of dummyLeads) {
  const result = scoreLead(lead as any);
  console.log(`\n========================================`);
  console.log(`Company: ${result.company_name}`);
  console.log(`Source: ${result.source}`);
  console.log(`TOTAL SCORE: ${result.lead_score.toFixed(2)}`);
  console.log(`PROC: ${result.proc_score} | CONT: ${result.cont_score} | CONF: ${result.conf_score} | FIT: ${result.fit_score}`);
  
  if (result.score_breakdown) {
    console.log(`Missing Evidence:`);
    const missingEvidenceSet = new Set<string>();
    Object.values(result.score_breakdown).forEach((metric: any) => {
      if (metric && metric.missing_evidence) {
        metric.missing_evidence.forEach((e: string) => missingEvidenceSet.add(e));
      }
    });
    Array.from(missingEvidenceSet).forEach(e => console.log(`  - ${e}`));
  }
  
  console.log(`Explanation: ${result.explanation}`);
}
