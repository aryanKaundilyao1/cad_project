import fs from 'fs';

const path = 'src/pages/admin/AdminLeadImport.tsx';
let content = fs.readFileSync(path, 'utf8');

const deduplicationLogic = `
      // --- DEDUPLICATION LOGIC ---
      // Fetch existing leads for this client to check for duplicates
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, company_name, website, phone, location')
        .eq('client_id', companyId);
      
      const existingMap = new Map();
      const existingNames = new Map();
      if (existingLeads) {
        existingLeads.forEach(l => {
          if (l.website) existingMap.set(l.website.toLowerCase(), l.id);
          if (l.phone) existingMap.set(l.phone.replace(/[^0-9]/g, ''), l.id);
          if (l.company_name) existingNames.set(l.company_name.toLowerCase(), l.id);
        });
      }

      const deduplicatedLeads = [];
      const duplicateFlags = [];

      newLeads.forEach((lead) => {
        let isExactDuplicate = false;
        let isNearDuplicate = false;

        const web = lead.website ? lead.website.toLowerCase() : null;
        const ph = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : null;
        const name = lead.company_name ? lead.company_name.toLowerCase() : null;

        if ((web && existingMap.has(web)) || (ph && existingMap.has(ph))) {
          isExactDuplicate = true;
        } else if (name && existingNames.has(name)) {
          isNearDuplicate = true; // Same name, missing contact info match -> Near dup
        }

        if (!isExactDuplicate) {
          if (isNearDuplicate) {
             lead.duplicate_flag = true; // Will need to ensure this column exists in DB, or store in metadata
             lead.raw_import = { ...lead.raw_import, duplicate_flag: true };
          }
          deduplicatedLeads.push(lead);
        }
      });

      if (deduplicatedLeads.length === 0) {
        setImportStatus({type: 'error', message: 'All leads were exact duplicates and skipped.'});
        setIsImporting(false);
        return;
      }
      
      const leadsToProcess = deduplicatedLeads;
      // --- END DEDUPLICATION LOGIC ---
`;

// Replace the line `const scoredResults = scoreBatch(newLeads.map(l => ({`
const targetStr = `const scoredResults = scoreBatch(newLeads.map(l => ({`;
const replacementStr = deduplicationLogic + `\n      const scoredResults = scoreBatch(leadsToProcess.map(l => ({`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  
  // Now replace newLeads.map with leadsToProcess.map for scoring assignment
  content = content.replace(
    /const leadsWithScores = newLeads\.map\(\(lead, index\) => \{/g, 
    `const leadsWithScores = leadsToProcess.map((lead, index) => {`
  );
  
  fs.writeFileSync(path, content);
  console.log("Successfully patched AdminLeadImport.tsx");
} else {
  console.log("Failed to find target string in AdminLeadImport.tsx");
}
