const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/ScrollReveal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update easing
content = content.replace(/ease: \[0\.25, 0\.1, 0\.25, 1\]/g, 'ease: [0.16, 1, 0.3, 1]');
// Add will-change style for hardware acceleration
content = content.replace(/animate=\{isInView \? \{ opacity: 1, x: 0, y: 0 \} : \{ opacity: 0, x, y \}\}/g, 'animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}\n      style={{ willChange: "transform, opacity" }}');

fs.writeFileSync(filePath, content, 'utf8');
