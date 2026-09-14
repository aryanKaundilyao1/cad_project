const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Remove Admin Marketplace Routes
appContent = appContent.replace(/<Route path="\/admin\/marketplace\/requirements"[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/admin\/marketplace\/profiles"[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/admin\/marketplace\/verifications"[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/admin\/marketplace\/products"[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/admin\/marketplace\/consultations"[^>]*\/>/g, '');

// Clean imports just in case
appContent = appContent
  .split('\n')
  .filter(line => !line.includes('AdminMarketplace'))
  .filter(line => !line.includes('AdminCompanyVerification'))
  .filter(line => !line.includes('AdminProductApproval'))
  .filter(line => !line.includes('AdminConsultationRequests'))
  .join('\n');

fs.writeFileSync(appPath, appContent);
