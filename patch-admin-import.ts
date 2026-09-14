import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminLeadImport.tsx', 'utf-8');

// 1. Add seller_id to lead creation
content = content.replace(
  /client_id: companyId,\n\s*product_ids: selectedProductIds,/g,
  "client_id: companyId,\n          seller_id: companyId,\n          product_ids: selectedProductIds,"
);

// 2. Change deduplication query to use seller_id
content = content.replace(
  /\.eq\('client_id', companyId\);/g,
  ".eq('seller_id', companyId);"
);

// 3. Fix Deduplication logic to save existing lead IDs
const oldDedup = `        if (!isExactDuplicate) {
          if (isNearDuplicate) {
             lead.duplicate_flag = true; // Will need to ensure this column exists in DB, or store in metadata
             lead.raw_import = { ...lead.raw_import, duplicate_flag: true };
          }
          deduplicatedLeads.push(lead);
        }`;

const newDedup = `        const existingLeadId = (web && existingMap.has(web)) ? existingMap.get(web) 
          : (ph && existingMap.has(ph)) ? existingMap.get(ph) 
          : (name && existingNames.has(name)) ? existingNames.get(name) : null;

        if (existingLeadId) {
          // It's a duplicate. Save it to update existing lead with new module.
          lead.existing_lead_id = existingLeadId;
          deduplicatedLeads.push(lead);
        } else {
          deduplicatedLeads.push(lead);
        }`;

content = content.replace(oldDedup, newDedup);

// 4. Update the "if (deduplicatedLeads.length === 0)" check
content = content.replace(
  /if \(deduplicatedLeads\.length === 0\) \{\n\s*setImportStatus\(\{type: 'error', message: 'All leads were exact duplicates and skipped\.'\}\);\n\s*setIsImporting\(false\);\n\s*return;\n\s*\}/g,
  `if (deduplicatedLeads.length === 0) {
        setImportStatus({type: 'error', message: 'No leads found to process.'});
        setIsImporting(false);
        return;
      }`
);

fs.writeFileSync('src/pages/admin/AdminLeadImport.tsx', content);
console.log("Patched 1-4 successfully.");
