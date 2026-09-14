const fs = require('fs');
const path = require('path');

const footerPath = path.join(__dirname, 'src', 'components', 'Footer.tsx');
let footerContent = fs.readFileSync(footerPath, 'utf8');

footerContent = footerContent.replace(
  "<li><button onClick={() => scrollToSection('marketplace')} className=\"text-muted-foreground hover:text-primary transition-colors\">B2B Marketplace</button></li>",
  ""
);

fs.writeFileSync(footerPath, footerContent);
