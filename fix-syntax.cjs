const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const lines = appContent.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed === '} />' || trimmed === '</Route>') {
    // Only remove these if they are likely orphans. 
    // Actually, </Route> could be valid if it closed a block.
    // Let's just remove `} />`
    if (trimmed === '} />') continue;
  }
  
  if (trimmed.startsWith('<Route path="products')) continue;
  if (trimmed.startsWith('<Route path="verification"')) continue;
  if (trimmed.startsWith('<Route path="enquiries"')) continue;
  
  // The seller route block was partially deleted.
  // <Route path="/seller" element={<PermissionMiddleware ...
  // was deleted, but the inside routes remain.
  // We need to just do a clean pass.
  
  fixedLines.push(lines[i]);
}

fs.writeFileSync(appPath, fixedLines.join('\n'));
