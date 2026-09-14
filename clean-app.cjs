const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Remove imports
appContent = appContent
  .split('\n')
  .filter(line => !line.includes('pages/marketplace/'))
  .filter(line => !line.includes('pages/seller/'))
  .filter(line => !line.includes('SellerDashboardLayout'))
  .join('\n');

// Remove routes (simplified regex to strip out lines with path="/marketplace etc)
// Since routes can span multiple lines if they have <Route ...> ... </Route>,
// we should just remove the single line routes first.

appContent = appContent.replace(/<Route path="\/marketplace[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/requirements[^>]*\/>/g, '');
appContent = appContent.replace(/<Route path="\/seller"[^>]*>[\s\S]*?<\/Route>/g, '');
appContent = appContent.replace(/<Route path="orders" element=\{<SellerOrders \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="rfqs" element=\{<SellerRFQs \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="messages" element=\{<SellerMessages \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="images" element=\{<SellerImages \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="certificates" element=\{<SellerCertificates \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="enquiries" element=\{<SellerMessages \/>\} \/>/g, '');

fs.writeFileSync(appPath, appContent);
console.log('App.tsx cleaned');
