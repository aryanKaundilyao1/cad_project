const fs = require('fs');
const path = require('path');

const archiveDir = path.join(__dirname, 'docs/archive/scoring-v1');

const deprecatedHeader = `# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

`;

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.startsWith('# DEPRECATED')) {
        fs.writeFileSync(fullPath, deprecatedHeader + content, 'utf8');
      }
    }
  }
}

if (fs.existsSync(archiveDir)) {
  processDir(archiveDir);
}
