const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/<section className="py-24 bg-background">/, '<section id="problem" className="py-24 bg-background">');
content = content.replace(/<section className="py-24 border-y border-white\/5 bg-white\/\[0\.01\]">/, '<section id="services" className="py-24 border-y border-white/5 bg-white/[0.01]">');
content = content.replace(/<section className="py-24" style={{ background: 'hsl\(222 47% 5%\)' }}>/, '<section id="why-jas" className="py-24" style={{ background: \'hsl(222 47% 5%)\' }}>');
content = content.replace(/<section className="py-24 md:py-32 relative overflow-hidden bg-background">/, '<section id="demo" className="py-24 md:py-32 relative overflow-hidden bg-background">');

fs.writeFileSync(filePath, content, 'utf8');
