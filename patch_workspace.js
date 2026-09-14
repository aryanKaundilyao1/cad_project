import fs from 'fs';
const path = 'src/components/layout/ClientWorkspaceLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
const filteredLines = lines.filter(line => !line.includes('/workspace/scoring'));

if (lines.length !== filteredLines.length) {
  fs.writeFileSync(path, filteredLines.join('\n'));
  console.log('Removed scoring engine link');
}
