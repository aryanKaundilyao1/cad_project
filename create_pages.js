const fs = require('fs');
const path = require('path');

const pages = [
  'src/pages/marketplace/MarketplaceHome.tsx',
  'src/pages/marketplace/BrowseCompanies.tsx',
  'src/pages/marketplace/BrowseProducts.tsx',
  'src/pages/marketplace/BrowseCategories.tsx',
  'src/pages/marketplace/MarketplaceCompanyProfile.tsx',
  'src/pages/marketplace/MarketplaceProductPage.tsx',
  'src/pages/marketplace/PostRequirement.tsx',
  'src/pages/marketplace/BrowseRequirements.tsx',
  'src/pages/admin/AdminMarketplaceRequirements.tsx',
  'src/pages/admin/AdminCompanyVerification.tsx',
  'src/pages/admin/AdminMarketplaceProfiles.tsx',
  'src/pages/admin/AdminProductApproval.tsx',
  'src/pages/admin/AdminConsultationRequests.tsx'
];

for (const file of pages) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const componentName = path.basename(file, '.tsx');
  const content = `import React from 'react';\n\nconst ${componentName} = () => {\n  return (\n    <div className="p-8 mt-16">\n      <h1 className="text-2xl font-bold">${componentName}</h1>\n      <p>Under construction...</p>\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
  fs.writeFileSync(file, content);
}
console.log("Pages created");
