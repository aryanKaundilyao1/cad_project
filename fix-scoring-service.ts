import fs from 'fs';

let content = fs.readFileSync('src/services/leadScoringService.ts', 'utf-8');
content = content.replace(/leadIds:/g, "lead_ids:");
fs.writeFileSync('src/services/leadScoringService.ts', content);
console.log("Fixed leadScoringService.");
