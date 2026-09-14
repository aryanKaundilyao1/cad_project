import fs from 'fs';

let content = fs.readFileSync('src/pages/LeadDetailPage.tsx', 'utf-8');

const targetStr = `  const phone = lead.phone || extractString(meta.phone || meta.phones || meta.mobile || meta.contact_number || meta.telephone);`;
const replaceStr = `  const phone = lead.phone || extractString(meta.phone || meta.phones || meta.mobile || meta.contact_number || meta.telephone || meta['Phone Number'] || meta['phone number'] || meta.phoneNumber || meta.phone_number);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/pages/LeadDetailPage.tsx', content);
  console.log("Patched LeadDetailPage.tsx with more phone fallbacks");
} else {
  console.log("Could not patch LeadDetailPage.tsx");
}

