import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminLeadImport.tsx', 'utf-8');

const targetStr = `        const rawImport: Record<string, string> = {};
        templateFields.forEach(tf => {
          if (fieldMap[tf.key]) {
            rawImport[tf.key] = row[fieldMap[tf.key]];
          }
        });`;

const replacementStr = `        const rawImport: Record<string, any> = { ...row }; // Save EVERYTHING
        // Ensure mapped keys are also explicitly set on standard keys for the engine
        templateFields.forEach(tf => {
          if (fieldMap[tf.key]) {
            rawImport[tf.key] = row[fieldMap[tf.key]];
          }
        });`;

if(content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/pages/admin/AdminLeadImport.tsx', content);
  console.log("Patched AdminLeadImport mapping successfully.");
} else {
  console.log("Could not find target string.");
}
