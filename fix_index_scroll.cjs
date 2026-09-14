const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace custom ScrollReveal to remove blur and add will-change
const oldReveal = /const ScrollReveal = \(\{ children, delay = 0, className = "" \}: \{ children: React\.ReactNode, delay\?: number, className\?: string \}\) => \{[\s\S]*?<\/>;\n\};/g;

content = content.replace(/initial=\{\{ opacity: 0, y: 30, filter: "blur\(4px\)" \}\}/g, 'initial={{ opacity: 0, y: 30 }}');
content = content.replace(/whileInView=\{\{ opacity: 1, y: 0, filter: "blur\(0px\)" \}\}/g, 'whileInView={{ opacity: 1, y: 0 }}\n      style={{ willChange: "transform, opacity" }}');

fs.writeFileSync(filePath, content, 'utf8');
