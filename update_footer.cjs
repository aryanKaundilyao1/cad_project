const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/Footer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard glowing elements
content = content.replace(/className="relative bg-dark-grid" style=\{\{ background: 'hsl\(222 47% 4%\)' \}\}/g, 'className="relative dark bg-background text-foreground"');
content = content.replace(/<div className="absolute top-0 left-0 right-0 h-px"[\s\S]*?\/>/g, '<div className="absolute top-0 left-0 right-0 h-px bg-foreground/20" />');
content = content.replace(/<span className="text-gradient-blue">/g, '<span>');
content = content.replace(/border-white\/\[0\.04\]/g, 'border-foreground/20');
content = content.replace(/border-white\/10/g, 'border-foreground/20');

// Fix text colors inside footer (muted-foreground in dark mode will be light blueish)
// No need to change classes if tailwind maps them correctly, but just in case:

fs.writeFileSync(filePath, content, 'utf8');
