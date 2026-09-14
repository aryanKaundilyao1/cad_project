const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/index.css');
let content = fs.readFileSync(filePath, 'utf8');

const scrollBehavior = `
  html, body {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;

if (!content.includes('scroll-behavior')) {
  content = content.replace('@layer base {', '@layer base {\n' + scrollBehavior);
  fs.writeFileSync(filePath, content, 'utf8');
}

