const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'src', 'pages', 'Auth.tsx');
let authContent = fs.readFileSync(authPath, 'utf8');

authContent = authContent.replace(
  /if \(user\.email === "trial1@jasconnectt\.in"\) \{[\s\S]*?\} else \{[\s\S]*?\}/,
  'navigate("/workspace");'
);

fs.writeFileSync(authPath, authContent);
