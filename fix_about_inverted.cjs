const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/About.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\{\/\* The JAS Way \*\/\}[\s\S]*?<\/ScrollReveal>/;
const match = content.match(regex);
if (match) {
  let sectionCode = match[0];
  sectionCode = sectionCode.replace(/text-foreground/g, 'text-primary-foreground');
  sectionCode = sectionCode.replace(/border-foreground\/20/g, 'border-primary-foreground/20');
  content = content.replace(regex, sectionCode);
}

fs.writeFileSync(filePath, content, 'utf8');
