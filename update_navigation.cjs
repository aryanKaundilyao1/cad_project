const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/Navigation.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard glowing elements
content = content.replace(/text-gradient-blue/g, "text-primary");
content = content.replace(/shadow-\[0_0_15px_rgba\(34,211,238,0\.2\)\]/g, "");
content = content.replace(/bg-card\/80 backdrop-blur-md/g, "bg-background border-b border-primary/20");
content = content.replace(/border-white\/5/g, "border-primary/20");
content = content.replace(/border-white\/10/g, "border-primary/20");
content = content.replace(/bg-card\/95 backdrop-blur-xl/g, "bg-background");
content = content.replace(/hover:bg-white\/5/g, "hover:bg-primary/5");
content = content.replace(/bg-white\/5/g, "bg-primary/10");

// Update the logo typography
content = content.replace(/group-hover:text-glow/g, "");

fs.writeFileSync(filePath, content, 'utf8');
