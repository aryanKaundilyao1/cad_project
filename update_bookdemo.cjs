const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/BookDemo.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace styles
content = content.replace(/bg-dot-grid/g, "bg-primary/5");
content = content.replace(/<div className="glow-orb[\s\S]*?\/>/g, "");
content = content.replace(/text-gradient-blue/g, "text-primary italic");
content = content.replace(/className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"/g, 'className="text-4xl md:text-5xl font-editorial tracking-tight mb-4"');
content = content.replace(/className="text-3xl font-bold"/g, 'className="text-3xl font-editorial font-bold"');
content = content.replace(/bg-card\/80 backdrop-blur-xl border-white\/10 shadow-2xl/g, 'bg-card border-primary/20');
content = content.replace(/border-white\/10 hover:border-primary\/30/g, 'border-primary/20 hover:border-primary');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-background');

fs.writeFileSync(filePath, content, 'utf8');
