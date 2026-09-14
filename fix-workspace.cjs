const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, 'src', 'pages', 'workspace', 'WorkspaceCompanyProfile.tsx');
let profileContent = fs.readFileSync(profilePath, 'utf8');

profileContent = profileContent.replace(/Manage your public marketplace presence and business details./g, "Manage your business details and profile.");
profileContent = profileContent.replace(/Complete your profile to increase trust and visibility in the marketplace./g, "Complete your profile to increase trust and visibility.");
profileContent = profileContent.replace(/Control how your company appears on the marketplace./g, "Control how your company appears to others.");
profileContent = profileContent.replace(/Upload your logo and company banner for the marketplace./g, "Upload your logo and company banner.");

fs.writeFileSync(profilePath, profileContent);
