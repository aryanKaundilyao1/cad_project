const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'pages', 'Index.tsx');
let indexContent = fs.readFileSync(indexPath, 'utf8');

indexContent = indexContent.replace(
  "Login to Platform",
  "Start Free Trial"
);

fs.writeFileSync(indexPath, indexContent);
