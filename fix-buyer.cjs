const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// The Buyer Portal starts around line 247:
// <Route path="/buyer" ...>
// ...
// </Route>
appContent = appContent.replace(/<Route path="\/buyer"[\s\S]*?<\/Route>/, '');

fs.writeFileSync(appPath, appContent);
