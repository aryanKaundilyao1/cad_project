const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/index.css');
let content = fs.readFileSync(filePath, 'utf8');

// Update accent to Terracotta and card to lighter cream
content = content.replace(/--accent: 222 60% 31%;/g, "--accent: 14 65% 52%; /* Terracotta */");
content = content.replace(/--card: 52 40% 90%;/g, "--card: 52 40% 94%; /* Lighter Cream */");

fs.writeFileSync(filePath, content, 'utf8');
