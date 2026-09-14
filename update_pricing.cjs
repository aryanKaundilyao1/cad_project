const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Pricing.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace styles
content = content.replace(/bg-dot-grid/g, "");
content = content.replace(/style=\{\{ background: 'hsl\(222 47% 4%\)' \}\}/g, 'className="bg-primary/5 border-b border-primary/20"');
content = content.replace(/<div className="glow-orb[\s\S]*?\/>/g, "");
content = content.replace(/text-gradient-blue/g, "text-primary italic");
content = content.replace(/text-4xl md:text-6xl font-bold/g, 'text-5xl md:text-7xl font-editorial tracking-tight');
content = content.replace(/text-3xl font-bold/g, 'text-3xl font-editorial font-bold');
content = content.replace(/text-2xl font-bold/g, 'text-2xl font-editorial font-bold');
content = content.replace(/flow-node/g, "border border-primary/20 bg-card rounded-none");
content = content.replace(/rounded-3xl/g, "rounded-none");
content = content.replace(/border border-white\/10/g, 'border border-primary/20');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-card');
content = content.replace(/bg-white\/5/g, 'bg-primary/10');
content = content.replace(/border-t border-white\/5/g, 'border-t border-primary/20');
content = content.replace(/bg-gradient-to-r from-primary\/20 to-accent\/20/g, 'bg-primary/10');
content = content.replace(/border-primary\/30/g, 'border-primary/50');
content = content.replace(/text-4xl font-bold/g, 'text-4xl font-editorial font-bold');
content = content.replace(/text-5xl font-bold/g, 'text-5xl font-editorial font-bold');

fs.writeFileSync(filePath, content, 'utf8');
