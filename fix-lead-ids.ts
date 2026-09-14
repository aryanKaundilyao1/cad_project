import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminLeadImport.tsx', 'utf-8');
content = content.replace(/body: \{ leadIds:/g, "body: { lead_ids:");
fs.writeFileSync('src/pages/admin/AdminLeadImport.tsx', content);
console.log("Fixed lead_ids typo in AdminLeadImport.");
