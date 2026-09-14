const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Auth.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-dot-grid/g, "bg-primary/5");
content = content.replace(/<div className="glow-orb[\s\S]*?\/>/g, "");
content = content.replace(/text-gradient-blue/g, "text-primary");
content = content.replace(/text-4xl md:text-5xl font-bold/g, 'text-4xl md:text-5xl font-editorial tracking-tight');
content = content.replace(/text-2xl font-bold/g, 'text-2xl font-editorial font-bold');
content = content.replace(/bg-card\/60 backdrop-blur-xl border-white\/10 shadow-2xl/g, 'bg-card border-primary/20');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-background');

fs.writeFileSync(filePath, content, 'utf8');
