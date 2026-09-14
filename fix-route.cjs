const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const lines = appContent.split('\n');
const newLines = lines.filter((line, index) => {
  // Line 230 has the orphaned `</Route>`
  if (line.trim() === '</Route>' && index > 220 && index < 240) {
    return false;
  }
  return true;
});

fs.writeFileSync(appPath, newLines.join('\n'));
