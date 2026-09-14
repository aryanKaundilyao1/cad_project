const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, 'src', 'components', 'layout', 'PremiumLockScreen.tsx');
let lockContent = fs.readFileSync(lockPath, 'utf8');

lockContent = lockContent.replace(
  "onClick={() => navigate('/marketplace')}",
  "onClick={() => navigate('/')}"
);
lockContent = lockContent.replace(
  "Return to Marketplace",
  "Return to Home"
);

fs.writeFileSync(lockPath, lockContent);
