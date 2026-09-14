const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Remove remaining seller references
appContent = appContent.replace(/<Route index element=\{<Navigate to="\/seller\/profile" replace \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="dashboard" element=\{<Navigate to="\/seller\/profile" replace \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="profile" element=\{<SellerProfileManager \/>\} \/>/g, '');
appContent = appContent.replace(/<Route path="catalogue" element=\{<SellerCatalogue \/>\} \/>/g, '');

fs.writeFileSync(appPath, appContent);
